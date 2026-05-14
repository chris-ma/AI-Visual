import { z } from 'zod'

export const createBrandSchema = z.object({
  workspaceId: z.string().uuid(),
  name: z.string().min(1, 'Brand name is required').max(100),
  aliases: z.array(z.string()).default([]),
  domains: z.array(z.string()).default([]),
  products: z.array(z.string()).default([]),
  category: z.string().optional(),
})

export const updateBrandSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  aliases: z.array(z.string()).optional(),
  domains: z.array(z.string()).optional(),
  products: z.array(z.string()).optional(),
  category: z.string().nullable().optional(),
})

export const addCompetitorSchema = z.object({
  brandId: z.string().uuid(),
  name: z.string().min(1, 'Competitor name is required').max(100),
  domains: z.array(z.string()).default([]),
})

export type CreateBrandInput = z.infer<typeof createBrandSchema>
export type UpdateBrandInput = z.infer<typeof updateBrandSchema>
export type AddCompetitorInput = z.infer<typeof addCompetitorSchema>
