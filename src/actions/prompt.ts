'use server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { prompts } from '@/lib/db/schema'
import { eq, desc } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { createPromptSchema, updatePromptSchema } from '@/lib/validations/prompt'
import { verifyWorkspaceMembership } from './workspace'

function serialize(p: any) {
  return { ...p, createdAt: p.createdAt.toISOString(), updatedAt: p.updatedAt.toISOString() }
}

export async function createPrompt(data: unknown) {
  const session = await auth()
  if (!session?.user?.id) throw new Error('Unauthorized')

  const validated = createPromptSchema.parse(data)
  await verifyWorkspaceMembership(validated.workspaceId)

  const [prompt] = await db.insert(prompts).values(validated).returning()
  revalidatePath('/prompts')
  return serialize(prompt)
}

export async function updatePrompt(promptId: string, data: unknown) {
  const session = await auth()
  if (!session?.user?.id) throw new Error('Unauthorized')

  const validated = updatePromptSchema.parse(data)
  const [existing] = await db.select().from(prompts).where(eq(prompts.id, promptId)).limit(1)
  if (!existing) throw new Error('Prompt not found')
  await verifyWorkspaceMembership(existing.workspaceId)

  const [updated] = await db
    .update(prompts)
    .set({ ...validated, updatedAt: new Date() })
    .where(eq(prompts.id, promptId))
    .returning()

  revalidatePath('/prompts')
  return serialize(updated)
}

export async function deletePrompt(promptId: string) {
  const session = await auth()
  if (!session?.user?.id) throw new Error('Unauthorized')

  const [existing] = await db.select().from(prompts).where(eq(prompts.id, promptId)).limit(1)
  if (!existing) throw new Error('Prompt not found')
  await verifyWorkspaceMembership(existing.workspaceId)

  await db.delete(prompts).where(eq(prompts.id, promptId))
  revalidatePath('/prompts')
}

export async function getPromptsForWorkspace(workspaceId: string) {
  const session = await auth()
  if (!session?.user?.id) throw new Error('Unauthorized')
  await verifyWorkspaceMembership(workspaceId)

  const result = await db.select().from(prompts).where(eq(prompts.workspaceId, workspaceId)).orderBy(desc(prompts.createdAt))
  return result.map(serialize)
}
