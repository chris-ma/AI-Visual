import { z } from 'zod'

export const createPromptSchema = z.object({
  workspaceId: z.string().uuid(),
  text: z.string().min(10, 'Prompt must be at least 10 characters').max(500),
  tags: z.array(z.string()).default([]),
  schedule: z.enum(['daily', 'weekly', 'manual']).default('manual'),
  locale: z.string().default('en-US'),
})

export const updatePromptSchema = z.object({
  text: z.string().min(10).max(500).optional(),
  tags: z.array(z.string()).optional(),
  schedule: z.enum(['daily', 'weekly', 'manual']).optional(),
  locale: z.string().optional(),
  status: z.enum(['active', 'paused']).optional(),
})

export type CreatePromptInput = z.infer<typeof createPromptSchema>
export type UpdatePromptInput = z.infer<typeof updatePromptSchema>
