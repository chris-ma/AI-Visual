'use server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { workspaces, workspaceMembers, users } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { createWorkspaceSchema } from '@/lib/validations/workspace'
import { generateSlug } from '@/lib/utils'
import bcrypt from 'bcryptjs'
import { z } from 'zod'

export async function createWorkspace(data: unknown) {
  const session = await auth()
  if (!session?.user?.id) throw new Error('Unauthorized')

  const validated = createWorkspaceSchema.parse(data)
  let slug = generateSlug(validated.name)

  const existing = await db.select().from(workspaces).where(eq(workspaces.slug, slug)).limit(1)
  if (existing.length > 0) slug = `${slug}-${Date.now().toString(36)}`

  const [workspace] = await db
    .insert(workspaces)
    .values({ name: validated.name, slug, ownerId: session.user.id })
    .returning()

  await db.insert(workspaceMembers).values({ workspaceId: workspace.id, userId: session.user.id, role: 'owner' })

  revalidatePath('/dashboard')
  return { ...workspace, createdAt: workspace.createdAt.toISOString(), updatedAt: workspace.updatedAt.toISOString() }
}

export async function getUserWorkspaces() {
  const session = await auth()
  if (!session?.user?.id) throw new Error('Unauthorized')

  const members = await db
    .select({
      workspaceId: workspaceMembers.workspaceId,
      role: workspaceMembers.role,
      name: workspaces.name,
      slug: workspaces.slug,
      ownerId: workspaces.ownerId,
      createdAt: workspaces.createdAt,
    })
    .from(workspaceMembers)
    .innerJoin(workspaces, eq(workspaceMembers.workspaceId, workspaces.id))
    .where(eq(workspaceMembers.userId, session.user.id))

  return members.map((m) => ({
    id: m.workspaceId,
    name: m.name,
    slug: m.slug,
    ownerId: m.ownerId,
    createdAt: m.createdAt.toISOString(),
    role: m.role,
  }))
}

export async function signUpUser(data: { name: string; email: string; password: string }) {
  const schema = z.object({
    name: z.string().min(2),
    email: z.string().email(),
    password: z.string().min(8),
  })
  const validated = schema.parse(data)
  const passwordHash = await bcrypt.hash(validated.password, 12)

  const existing = await db.select().from(users).where(eq(users.email, validated.email)).limit(1)
  if (existing.length > 0) throw new Error('Email already registered')

  const [user] = await db
    .insert(users)
    .values({ name: validated.name, email: validated.email, passwordHash })
    .returning()

  return user
}

export async function verifyWorkspaceMembership(workspaceId: string) {
  const session = await auth()
  if (!session?.user?.id) throw new Error('Unauthorized')

  const [member] = await db
    .select()
    .from(workspaceMembers)
    .where(and(eq(workspaceMembers.workspaceId, workspaceId), eq(workspaceMembers.userId, session.user.id)))
    .limit(1)

  if (!member) throw new Error('Not a member of this workspace')
  return member
}
