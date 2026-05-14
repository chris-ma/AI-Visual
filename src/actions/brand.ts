'use server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { brands, competitors } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { createBrandSchema, updateBrandSchema, addCompetitorSchema } from '@/lib/validations/brand'
import { verifyWorkspaceMembership } from './workspace'

function serializeBrand(b: any) {
  return { ...b, createdAt: b.createdAt.toISOString(), updatedAt: b.updatedAt.toISOString() }
}

function serializeCompetitor(c: any) {
  return { ...c, createdAt: c.createdAt.toISOString() }
}

export async function createBrand(data: unknown) {
  const session = await auth()
  if (!session?.user?.id) throw new Error('Unauthorized')

  const validated = createBrandSchema.parse(data)
  await verifyWorkspaceMembership(validated.workspaceId)

  const [brand] = await db.insert(brands).values(validated).returning()
  revalidatePath('/settings/brand')
  return serializeBrand(brand)
}

export async function updateBrand(brandId: string, data: unknown) {
  const session = await auth()
  if (!session?.user?.id) throw new Error('Unauthorized')

  const validated = updateBrandSchema.parse(data)
  const [existing] = await db.select().from(brands).where(eq(brands.id, brandId)).limit(1)
  if (!existing) throw new Error('Brand not found')
  await verifyWorkspaceMembership(existing.workspaceId)

  const [updated] = await db
    .update(brands)
    .set({ ...validated, updatedAt: new Date() })
    .where(eq(brands.id, brandId))
    .returning()

  revalidatePath('/settings/brand')
  return serializeBrand(updated)
}

export async function getBrandForWorkspace(workspaceId: string) {
  const session = await auth()
  if (!session?.user?.id) throw new Error('Unauthorized')
  await verifyWorkspaceMembership(workspaceId)

  const [brand] = await db.select().from(brands).where(eq(brands.workspaceId, workspaceId)).limit(1)
  return brand ? serializeBrand(brand) : null
}

export async function addCompetitor(data: unknown) {
  const session = await auth()
  if (!session?.user?.id) throw new Error('Unauthorized')

  const validated = addCompetitorSchema.parse(data)
  const [brand] = await db.select().from(brands).where(eq(brands.id, validated.brandId)).limit(1)
  if (!brand) throw new Error('Brand not found')
  await verifyWorkspaceMembership(brand.workspaceId)

  const [competitor] = await db.insert(competitors).values(validated).returning()
  revalidatePath('/settings/brand')
  return serializeCompetitor(competitor)
}

export async function deleteCompetitor(competitorId: string) {
  const session = await auth()
  if (!session?.user?.id) throw new Error('Unauthorized')

  const [comp] = await db.select().from(competitors).where(eq(competitors.id, competitorId)).limit(1)
  if (!comp) throw new Error('Competitor not found')

  const [brand] = await db.select().from(brands).where(eq(brands.id, comp.brandId)).limit(1)
  if (brand) await verifyWorkspaceMembership(brand.workspaceId)

  await db.delete(competitors).where(eq(competitors.id, competitorId))
  revalidatePath('/settings/brand')
}

export async function getCompetitorsForBrand(brandId: string) {
  const session = await auth()
  if (!session?.user?.id) throw new Error('Unauthorized')

  const [brand] = await db.select().from(brands).where(eq(brands.id, brandId)).limit(1)
  if (!brand) return []
  await verifyWorkspaceMembership(brand.workspaceId)

  const result = await db.select().from(competitors).where(eq(competitors.brandId, brandId))
  return result.map(serializeCompetitor)
}
