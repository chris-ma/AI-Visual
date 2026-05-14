import type { Brand, Competitor } from '@/types'

export interface ParsedMention {
  entityName: string
  role: 'mentioned' | 'recommended' | 'compared'
  prominence: 'high' | 'medium' | 'low'
  confidence: number
  sentiment: 'positive' | 'neutral' | 'negative' | 'risky'
  excerpt: string | null
}

export interface ParsedCitation {
  url: string
  domain: string
  title: string | null
}

export interface ParsedSimulation {
  rawResponse: string
  mentions: ParsedMention[]
  citations: ParsedCitation[]
}

export function parseSimulationResponse(
  fullResponse: string,
  brand: Brand,
  competitors: Competitor[]
): ParsedSimulation {
  const jsonMatch = fullResponse.match(/```json\n([\s\S]*?)\n```/)
  const rawResponse = jsonMatch
    ? fullResponse.slice(0, fullResponse.indexOf('```json')).trim()
    : fullResponse.trim()

  let mentions: ParsedMention[] = []
  let citations: ParsedCitation[] = []

  if (jsonMatch) {
    try {
      const parsed = JSON.parse(jsonMatch[1])
      if (Array.isArray(parsed.mentions)) {
        mentions = parsed.mentions
          .filter((m: any) => m.entity_name && m.role && m.prominence && m.sentiment)
          .map((m: any) => ({
            entityName: String(m.entity_name),
            role: validateRole(m.role),
            prominence: validateProminence(m.prominence),
            confidence: Math.min(1, Math.max(0, Number(m.confidence) || 0.8)),
            sentiment: validateSentiment(m.sentiment),
            excerpt: m.excerpt ? String(m.excerpt) : null,
          }))
      }
      if (Array.isArray(parsed.citations)) {
        citations = parsed.citations
          .filter((c: any) => c.url && c.domain)
          .map((c: any) => ({
            url: String(c.url),
            domain: String(c.domain),
            title: c.title ? String(c.title) : null,
          }))
      }
    } catch {
      mentions = heuristicMentions(rawResponse, brand, competitors)
    }
  } else {
    mentions = heuristicMentions(rawResponse, brand, competitors)
  }

  return { rawResponse, mentions, citations }
}

function validateRole(role: string): 'mentioned' | 'recommended' | 'compared' {
  if (['mentioned', 'recommended', 'compared'].includes(role)) return role as any
  return 'mentioned'
}

function validateProminence(p: string): 'high' | 'medium' | 'low' {
  if (['high', 'medium', 'low'].includes(p)) return p as any
  return 'medium'
}

function validateSentiment(s: string): 'positive' | 'neutral' | 'negative' | 'risky' {
  if (['positive', 'neutral', 'negative', 'risky'].includes(s)) return s as any
  return 'neutral'
}

function heuristicMentions(text: string, brand: Brand, competitors: Competitor[]): ParsedMention[] {
  const results: ParsedMention[] = []
  const lowerText = text.toLowerCase()

  const brandTerms = [brand.name, ...(brand.aliases ?? [])]
  for (const term of brandTerms) {
    if (lowerText.includes(term.toLowerCase())) {
      results.push({ entityName: brand.name, role: 'mentioned', prominence: 'medium', confidence: 0.6, sentiment: 'neutral', excerpt: null })
      break
    }
  }

  for (const comp of competitors) {
    if (lowerText.includes(comp.name.toLowerCase())) {
      results.push({ entityName: comp.name, role: 'mentioned', prominence: 'medium', confidence: 0.6, sentiment: 'neutral', excerpt: null })
    }
  }

  return results
}
