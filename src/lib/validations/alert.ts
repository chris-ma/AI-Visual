import { z } from 'zod'

export const createAlertSchema = z.object({
  workspaceId: z.string().uuid(),
  type: z.enum(['visibility_drop', 'competitor_overtake', 'mention_spike', 'citation_lost']),
  threshold: z.number().min(0).max(100).default(10),
  channel: z.enum(['email', 'slack']).default('email'),
  config: z.record(z.string(), z.unknown()).default({}),
})

export type CreateAlertInput = z.infer<typeof createAlertSchema>
