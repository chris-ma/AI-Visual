export type MemberRole = 'owner' | 'admin' | 'member'
export type AIEngine = 'chatgpt' | 'perplexity' | 'gemini' | 'claude' | 'grok'
export type RunStatus = 'pending' | 'completed' | 'failed'
export type MentionRole = 'mentioned' | 'recommended' | 'compared'
export type ProminenceLevel = 'high' | 'medium' | 'low'
export type SentimentType = 'positive' | 'neutral' | 'negative' | 'risky'
export type EntityType = 'brand' | 'competitor'
export type AlertType = 'visibility_drop' | 'competitor_overtake' | 'mention_spike' | 'citation_lost'
export type AlertChannel = 'email' | 'slack'
export type PromptSchedule = 'daily' | 'weekly' | 'manual'
export type PromptStatus = 'active' | 'paused'

export interface User {
  id: string
  name: string | null
  email: string
  createdAt: string
}

export interface Workspace {
  id: string
  name: string
  slug: string
  ownerId: string
  createdAt: string
}

export interface WorkspaceMember {
  workspaceId: string
  userId: string
  role: MemberRole
  createdAt: string
}

export interface Brand {
  id: string
  workspaceId: string
  name: string
  aliases: string[]
  domains: string[]
  products: string[]
  category: string | null
  createdAt: string
  updatedAt: string
}

export interface Competitor {
  id: string
  brandId: string
  name: string
  domains: string[]
  createdAt: string
}

export interface Prompt {
  id: string
  workspaceId: string
  text: string
  tags: string[]
  schedule: PromptSchedule
  locale: string
  status: PromptStatus
  createdAt: string
  updatedAt: string
}

export interface PromptRun {
  id: string
  promptId: string
  engine: AIEngine
  timestamp: string
  rawResponse: string | null
  status: RunStatus
  locale: string
  errorMsg: string | null
}

export interface Mention {
  id: string
  promptRunId: string
  entityId: string
  entityType: EntityType
  role: MentionRole
  prominence: ProminenceLevel
  confidence: number
  sentiment: SentimentType
  excerpt: string | null
}

export interface Citation {
  id: string
  promptRunId: string
  url: string
  domain: string
  title: string | null
  isOwned: boolean
}

export interface VisibilityScore {
  id: string
  workspaceId: string
  brandId: string
  calculatedAt: string
  periodStart: string
  periodEnd: string
  presenceScore: number
  recommendationScore: number
  prominenceScore: number
  citationScore: number
  narrativeScore: number
  competitiveShare: number
  overallScore: number
  runCount: number
}

export interface Alert {
  id: string
  workspaceId: string
  type: AlertType
  threshold: number
  channel: AlertChannel
  isActive: boolean
  config: Record<string, unknown>
  createdAt: string
}

export interface ScoreBreakdown {
  presence: number
  recommendation: number
  prominence: number
  citation: number
  narrative: number
  competitive: number
  overall: number
}

export interface PromptRunWithDetails extends PromptRun {
  mentions: (Mention & { entityName: string })[]
  citations: Citation[]
  prompt?: Prompt
}

export interface BrandWithCompetitors extends Brand {
  competitors: Competitor[]
}

export interface WorkspaceWithMember extends Workspace {
  role: MemberRole
}

export type WorkspaceWithRole = WorkspaceWithMember
