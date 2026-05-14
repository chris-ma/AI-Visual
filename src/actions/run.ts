'use server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { prompts, promptRuns, mentions, citations, brands, competitors, visibilityScores } from '@/lib/db/schema'
import { eq, desc, gte, and, inArray } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { getAnthropicClient } from '@/lib/anthropic/client'
import { buildSimulationPrompt } from '@/lib/anthropic/simulate'
import { parseSimulationResponse } from '@/lib/anthropic/parse'
import { calculateScoreBreakdown } from '@/lib/scoring/calculate'
import { verifyWorkspaceMembership } from './workspace'
import type { AIEngine } from '@/types'

export async function runPrompt(promptId: string, engine: AIEngine) {
  const session = await auth()
  if (!session?.user?.id) throw new Error('Unauthorized')

  const [prompt] = await db.select().from(prompts).where(eq(prompts.id, promptId)).limit(1)
  if (!prompt) throw new Error('Prompt not found')
  await verifyWorkspaceMembership(prompt.workspaceId)

  const [brand] = await db.select().from(brands).where(eq(brands.workspaceId, prompt.workspaceId)).limit(1)
  if (!brand) throw new Error('No brand configured. Set up your brand in Settings first.')

  const competitorList = await db.select().from(competitors).where(eq(competitors.brandId, brand.id))

  const [run] = await db
    .insert(promptRuns)
    .values({ promptId, engine, status: 'pending', locale: prompt.locale })
    .returning()

  try {
    const anthropic = getAnthropicClient()
    const simPrompt = buildSimulationPrompt({
      brand: {
        name: brand.name,
        aliases: brand.aliases ?? [],
        domains: brand.domains ?? [],
        products: brand.products ?? [],
        category: brand.category,
      },
      competitors: competitorList.map((c) => ({ name: c.name, domains: c.domains ?? [] })),
      engine,
      promptText: prompt.text,
      locale: prompt.locale,
    })

    const message = await anthropic.messages.create({
      model: 'claude-opus-4-5',
      max_tokens: 2000,
      messages: [{ role: 'user', content: simPrompt }],
    })

    const fullText = message.content[0].type === 'text' ? message.content[0].text : ''

    const brandForParse = {
      id: brand.id, workspaceId: brand.workspaceId, name: brand.name,
      aliases: brand.aliases ?? [], domains: brand.domains ?? [],
      products: brand.products ?? [], category: brand.category,
      createdAt: brand.createdAt.toISOString(), updatedAt: brand.updatedAt.toISOString(),
    }
    const competitorsForParse = competitorList.map((c) => ({
      id: c.id, brandId: c.brandId, name: c.name,
      domains: c.domains ?? [], createdAt: c.createdAt.toISOString(),
    }))

    const parsed = parseSimulationResponse(fullText, brandForParse, competitorsForParse)

    const entityMap = new Map<string, { id: string; type: 'brand' | 'competitor' }>()
    entityMap.set(brand.name.toLowerCase(), { id: brand.id, type: 'brand' })
    for (const alias of brand.aliases ?? []) entityMap.set(alias.toLowerCase(), { id: brand.id, type: 'brand' })
    for (const comp of competitorList) entityMap.set(comp.name.toLowerCase(), { id: comp.id, type: 'competitor' })

    const mentionsToInsert = parsed.mentions
      .map((m) => {
        const entity = entityMap.get(m.entityName.toLowerCase())
        if (!entity) return null
        return {
          promptRunId: run.id,
          entityId: entity.id,
          entityType: entity.type as 'brand' | 'competitor',
          role: m.role,
          prominence: m.prominence,
          confidence: m.confidence,
          sentiment: m.sentiment,
          excerpt: m.excerpt,
        }
      })
      .filter((m): m is NonNullable<typeof m> => m !== null)

    if (mentionsToInsert.length > 0) await db.insert(mentions).values(mentionsToInsert)

    const ownedDomains = new Set(brand.domains ?? [])
    const citationsToInsert = parsed.citations.map((c) => ({
      promptRunId: run.id, url: c.url, domain: c.domain, title: c.title, isOwned: ownedDomains.has(c.domain),
    }))
    if (citationsToInsert.length > 0) await db.insert(citations).values(citationsToInsert)

    await db.update(promptRuns).set({ status: 'completed', rawResponse: parsed.rawResponse }).where(eq(promptRuns.id, run.id))

    await recalculateScores(brand.id, prompt.workspaceId)

    revalidatePath('/dashboard')
    revalidatePath('/prompts')
    return { success: true, runId: run.id }
  } catch (error) {
    await db.update(promptRuns).set({ status: 'failed', errorMsg: String(error) }).where(eq(promptRuns.id, run.id))
    throw error
  }
}

async function recalculateScores(brandId: string, workspaceId: string) {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)

  const recentRuns = await db
    .select({ id: promptRuns.id })
    .from(promptRuns)
    .innerJoin(prompts, eq(promptRuns.promptId, prompts.id))
    .where(and(eq(prompts.workspaceId, workspaceId), gte(promptRuns.timestamp, thirtyDaysAgo), eq(promptRuns.status, 'completed')))

  if (recentRuns.length === 0) return

  const runIds = recentRuns.map((r) => r.id)

  const allMentionsRaw = await db.select().from(mentions).where(inArray(mentions.promptRunId, runIds))
  const allCitationsRaw = await db.select().from(citations).where(inArray(citations.promptRunId, runIds))

  const toMention = (m: any) => ({
    id: m.id, promptRunId: m.promptRunId, entityId: m.entityId,
    entityType: m.entityType as 'brand' | 'competitor',
    role: m.role as 'mentioned' | 'recommended' | 'compared',
    prominence: m.prominence as 'high' | 'medium' | 'low',
    confidence: m.confidence,
    sentiment: m.sentiment as 'positive' | 'neutral' | 'negative' | 'risky',
    excerpt: m.excerpt,
  })

  const brandMentions = allMentionsRaw.filter((m) => m.entityId === brandId && m.entityType === 'brand').map(toMention)
  const allMentions = allMentionsRaw.map(toMention)
  const allCitations = allCitationsRaw.map((c) => ({
    id: c.id, promptRunId: c.promptRunId, url: c.url, domain: c.domain, title: c.title, isOwned: c.isOwned,
  }))

  const scores = calculateScoreBreakdown(brandMentions, allMentions, allCitations, recentRuns.length)

  await db.insert(visibilityScores).values({
    workspaceId, brandId,
    periodStart: thirtyDaysAgo, periodEnd: new Date(),
    presenceScore: scores.presence, recommendationScore: scores.recommendation,
    prominenceScore: scores.prominence, citationScore: scores.citation,
    narrativeScore: scores.narrative, competitiveShare: scores.competitive,
    overallScore: scores.overall, runCount: recentRuns.length,
  })
}

export async function getRunsForPrompt(promptId: string) {
  const session = await auth()
  if (!session?.user?.id) throw new Error('Unauthorized')

  const [prompt] = await db.select().from(prompts).where(eq(prompts.id, promptId)).limit(1)
  if (!prompt) return []
  await verifyWorkspaceMembership(prompt.workspaceId)

  const runs = await db
    .select()
    .from(promptRuns)
    .where(eq(promptRuns.promptId, promptId))
    .orderBy(desc(promptRuns.timestamp))
    .limit(20)

  return runs.map((r) => ({ ...r, timestamp: r.timestamp.toISOString() }))
}

export async function getRecentRunsForWorkspace(workspaceId: string) {
  const session = await auth()
  if (!session?.user?.id) throw new Error('Unauthorized')
  await verifyWorkspaceMembership(workspaceId)

  const runs = await db
    .select({
      id: promptRuns.id,
      promptId: promptRuns.promptId,
      engine: promptRuns.engine,
      timestamp: promptRuns.timestamp,
      status: promptRuns.status,
      promptText: prompts.text,
    })
    .from(promptRuns)
    .innerJoin(prompts, eq(promptRuns.promptId, prompts.id))
    .where(eq(prompts.workspaceId, workspaceId))
    .orderBy(desc(promptRuns.timestamp))
    .limit(10)

  return runs.map((r) => ({ ...r, timestamp: r.timestamp.toISOString() }))
}

export async function getVisibilityScores(workspaceId: string, brandId: string) {
  const session = await auth()
  if (!session?.user?.id) throw new Error('Unauthorized')
  await verifyWorkspaceMembership(workspaceId)

  const scores = await db
    .select()
    .from(visibilityScores)
    .where(and(eq(visibilityScores.workspaceId, workspaceId), eq(visibilityScores.brandId, brandId)))
    .orderBy(desc(visibilityScores.calculatedAt))
    .limit(30)

  return scores.map((s) => ({
    ...s,
    calculatedAt: s.calculatedAt.toISOString(),
    periodStart: s.periodStart.toISOString(),
    periodEnd: s.periodEnd.toISOString(),
  }))
}

export async function getMentionsForRun(runId: string) {
  const session = await auth()
  if (!session?.user?.id) throw new Error('Unauthorized')

  const result = await db.select().from(mentions).where(eq(mentions.promptRunId, runId))
  return result.map((m) => ({
    ...m,
    entityType: m.entityType as 'brand' | 'competitor',
    role: m.role as 'mentioned' | 'recommended' | 'compared',
    prominence: m.prominence as 'high' | 'medium' | 'low',
    sentiment: m.sentiment as 'positive' | 'neutral' | 'negative' | 'risky',
  }))
}

export async function getCitationsForRun(runId: string) {
  return db.select().from(citations).where(eq(citations.promptRunId, runId))
}

export async function getCitationsForWorkspace(workspaceId: string) {
  const session = await auth()
  if (!session?.user?.id) throw new Error('Unauthorized')
  await verifyWorkspaceMembership(workspaceId)

  const result = await db
    .select({ domain: citations.domain, isOwned: citations.isOwned, id: citations.id })
    .from(citations)
    .innerJoin(promptRuns, eq(citations.promptRunId, promptRuns.id))
    .innerJoin(prompts, eq(promptRuns.promptId, prompts.id))
    .where(eq(prompts.workspaceId, workspaceId))

  const domainCounts = new Map<string, { count: number; isOwned: boolean }>()
  for (const c of result) {
    const existing = domainCounts.get(c.domain)
    if (existing) existing.count++
    else domainCounts.set(c.domain, { count: 1, isOwned: c.isOwned })
  }

  return Array.from(domainCounts.entries())
    .map(([domain, { count, isOwned }]) => ({ domain, count, isOwned }))
    .sort((a, b) => b.count - a.count)
}

export async function getMentionsByEntityForWorkspace(workspaceId: string) {
  const session = await auth()
  if (!session?.user?.id) throw new Error('Unauthorized')
  await verifyWorkspaceMembership(workspaceId)

  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)

  const result = await db
    .select({
      entityId: mentions.entityId,
      entityType: mentions.entityType,
      role: mentions.role,
    })
    .from(mentions)
    .innerJoin(promptRuns, eq(mentions.promptRunId, promptRuns.id))
    .innerJoin(prompts, eq(promptRuns.promptId, prompts.id))
    .where(and(eq(prompts.workspaceId, workspaceId), gte(promptRuns.timestamp, thirtyDaysAgo)))

  const counts = new Map<string, { entityId: string; entityType: string; mentioned: number; recommended: number; compared: number }>()
  for (const m of result) {
    const existing = counts.get(m.entityId) ?? { entityId: m.entityId, entityType: m.entityType, mentioned: 0, recommended: 0, compared: 0 }
    existing[m.role as 'mentioned' | 'recommended' | 'compared']++
    counts.set(m.entityId, existing)
  }

  return Array.from(counts.values())
}
