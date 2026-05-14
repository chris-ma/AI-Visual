'use server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { alerts } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { createAlertSchema } from '@/lib/validations/alert'
import { verifyWorkspaceMembership } from './workspace'

function serialize(a: any) {
  return { ...a, createdAt: a.createdAt.toISOString(), config: a.config as Record<string, unknown> }
}

export async function createAlert(data: unknown) {
  const session = await auth()
  if (!session?.user?.id) throw new Error('Unauthorized')

  const validated = createAlertSchema.parse(data)
  await verifyWorkspaceMembership(validated.workspaceId)

  const [alert] = await db.insert(alerts).values(validated).returning()
  revalidatePath('/alerts')
  return serialize(alert)
}

export async function toggleAlert(alertId: string) {
  const session = await auth()
  if (!session?.user?.id) throw new Error('Unauthorized')

  const [existing] = await db.select().from(alerts).where(eq(alerts.id, alertId)).limit(1)
  if (!existing) throw new Error('Alert not found')
  await verifyWorkspaceMembership(existing.workspaceId)

  const [updated] = await db.update(alerts).set({ isActive: !existing.isActive }).where(eq(alerts.id, alertId)).returning()
  revalidatePath('/alerts')
  return serialize(updated)
}

export async function deleteAlert(alertId: string) {
  const session = await auth()
  if (!session?.user?.id) throw new Error('Unauthorized')

  const [existing] = await db.select().from(alerts).where(eq(alerts.id, alertId)).limit(1)
  if (!existing) throw new Error('Alert not found')
  await verifyWorkspaceMembership(existing.workspaceId)

  await db.delete(alerts).where(eq(alerts.id, alertId))
  revalidatePath('/alerts')
}

export async function getAlertsForWorkspace(workspaceId: string) {
  const session = await auth()
  if (!session?.user?.id) throw new Error('Unauthorized')
  await verifyWorkspaceMembership(workspaceId)

  const result = await db.select().from(alerts).where(eq(alerts.workspaceId, workspaceId))
  return result.map(serialize)
}
