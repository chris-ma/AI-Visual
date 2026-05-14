import {
  pgTable,
  text,
  timestamp,
  uuid,
  pgEnum,
  boolean,
  real,
  integer,
  jsonb,
  primaryKey,
} from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'

export const memberRoleEnum = pgEnum('member_role', ['owner', 'admin', 'member'])
export const promptScheduleEnum = pgEnum('prompt_schedule', ['daily', 'weekly', 'manual'])
export const promptStatusEnum = pgEnum('prompt_status', ['active', 'paused'])
export const aiEngineEnum = pgEnum('ai_engine', ['chatgpt', 'perplexity', 'gemini', 'claude', 'grok'])
export const runStatusEnum = pgEnum('run_status', ['pending', 'completed', 'failed'])
export const mentionRoleEnum = pgEnum('mention_role', ['mentioned', 'recommended', 'compared'])
export const prominenceLevelEnum = pgEnum('prominence_level', ['high', 'medium', 'low'])
export const sentimentTypeEnum = pgEnum('sentiment_type', ['positive', 'neutral', 'negative', 'risky'])
export const entityTypeEnum = pgEnum('entity_type', ['brand', 'competitor'])
export const alertTypeEnum = pgEnum('alert_type', ['visibility_drop', 'competitor_overtake', 'mention_spike', 'citation_lost'])
export const alertChannelEnum = pgEnum('alert_channel', ['email', 'slack'])

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name'),
  email: text('email').notNull().unique(),
  emailVerified: timestamp('email_verified'),
  image: text('image'),
  passwordHash: text('password_hash'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

export const accounts = pgTable('accounts', {
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  type: text('type').notNull(),
  provider: text('provider').notNull(),
  providerAccountId: text('provider_account_id').notNull(),
  refreshToken: text('refresh_token'),
  accessToken: text('access_token'),
  expiresAt: integer('expires_at'),
  tokenType: text('token_type'),
  scope: text('scope'),
  idToken: text('id_token'),
  sessionState: text('session_state'),
}, (table) => ({
  pk: primaryKey({ columns: [table.provider, table.providerAccountId] }),
}))

export const sessions = pgTable('sessions', {
  sessionToken: text('session_token').primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  expires: timestamp('expires').notNull(),
})

export const verificationTokens = pgTable('verification_tokens', {
  identifier: text('identifier').notNull(),
  token: text('token').notNull(),
  expires: timestamp('expires').notNull(),
}, (table) => ({
  pk: primaryKey({ columns: [table.identifier, table.token] }),
}))

export const workspaces = pgTable('workspaces', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  ownerId: uuid('owner_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

export const workspaceMembers = pgTable('workspace_members', {
  workspaceId: uuid('workspace_id').notNull().references(() => workspaces.id, { onDelete: 'cascade' }),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  role: memberRoleEnum('role').notNull().default('member'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
}, (table) => ({
  pk: primaryKey({ columns: [table.workspaceId, table.userId] }),
}))

export const brands = pgTable('brands', {
  id: uuid('id').primaryKey().defaultRandom(),
  workspaceId: uuid('workspace_id').notNull().references(() => workspaces.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  aliases: text('aliases').array().notNull().default([]),
  domains: text('domains').array().notNull().default([]),
  products: text('products').array().notNull().default([]),
  category: text('category'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

export const competitors = pgTable('competitors', {
  id: uuid('id').primaryKey().defaultRandom(),
  brandId: uuid('brand_id').notNull().references(() => brands.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  domains: text('domains').array().notNull().default([]),
  createdAt: timestamp('created_at').notNull().defaultNow(),
})

export const prompts = pgTable('prompts', {
  id: uuid('id').primaryKey().defaultRandom(),
  workspaceId: uuid('workspace_id').notNull().references(() => workspaces.id, { onDelete: 'cascade' }),
  text: text('text').notNull(),
  tags: text('tags').array().notNull().default([]),
  schedule: promptScheduleEnum('schedule').notNull().default('manual'),
  locale: text('locale').notNull().default('en-US'),
  status: promptStatusEnum('status').notNull().default('active'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

export const promptRuns = pgTable('prompt_runs', {
  id: uuid('id').primaryKey().defaultRandom(),
  promptId: uuid('prompt_id').notNull().references(() => prompts.id, { onDelete: 'cascade' }),
  engine: aiEngineEnum('engine').notNull(),
  timestamp: timestamp('timestamp').notNull().defaultNow(),
  rawResponse: text('raw_response'),
  status: runStatusEnum('status').notNull().default('pending'),
  locale: text('locale').notNull().default('en-US'),
  errorMsg: text('error_msg'),
})

export const mentions = pgTable('mentions', {
  id: uuid('id').primaryKey().defaultRandom(),
  promptRunId: uuid('prompt_run_id').notNull().references(() => promptRuns.id, { onDelete: 'cascade' }),
  entityId: uuid('entity_id').notNull(),
  entityType: entityTypeEnum('entity_type').notNull(),
  role: mentionRoleEnum('role').notNull(),
  prominence: prominenceLevelEnum('prominence').notNull(),
  confidence: real('confidence').notNull().default(1.0),
  sentiment: sentimentTypeEnum('sentiment').notNull(),
  excerpt: text('excerpt'),
})

export const citations = pgTable('citations', {
  id: uuid('id').primaryKey().defaultRandom(),
  promptRunId: uuid('prompt_run_id').notNull().references(() => promptRuns.id, { onDelete: 'cascade' }),
  url: text('url').notNull(),
  domain: text('domain').notNull(),
  title: text('title'),
  isOwned: boolean('is_owned').notNull().default(false),
})

export const visibilityScores = pgTable('visibility_scores', {
  id: uuid('id').primaryKey().defaultRandom(),
  workspaceId: uuid('workspace_id').notNull().references(() => workspaces.id, { onDelete: 'cascade' }),
  brandId: uuid('brand_id').notNull().references(() => brands.id, { onDelete: 'cascade' }),
  calculatedAt: timestamp('calculated_at').notNull().defaultNow(),
  periodStart: timestamp('period_start').notNull(),
  periodEnd: timestamp('period_end').notNull(),
  presenceScore: real('presence_score').notNull().default(0),
  recommendationScore: real('recommendation_score').notNull().default(0),
  prominenceScore: real('prominence_score').notNull().default(0),
  citationScore: real('citation_score').notNull().default(0),
  narrativeScore: real('narrative_score').notNull().default(0),
  competitiveShare: real('competitive_share').notNull().default(0),
  overallScore: real('overall_score').notNull().default(0),
  runCount: integer('run_count').notNull().default(0),
})

export const alerts = pgTable('alerts', {
  id: uuid('id').primaryKey().defaultRandom(),
  workspaceId: uuid('workspace_id').notNull().references(() => workspaces.id, { onDelete: 'cascade' }),
  type: alertTypeEnum('type').notNull(),
  threshold: real('threshold').notNull().default(10),
  channel: alertChannelEnum('channel').notNull().default('email'),
  isActive: boolean('is_active').notNull().default(true),
  config: jsonb('config').notNull().default({}),
  createdAt: timestamp('created_at').notNull().defaultNow(),
})

export const workspacesRelations = relations(workspaces, ({ one, many }) => ({
  owner: one(users, { fields: [workspaces.ownerId], references: [users.id] }),
  members: many(workspaceMembers),
  brands: many(brands),
  prompts: many(prompts),
  scores: many(visibilityScores),
  alerts: many(alerts),
}))

export const brandsRelations = relations(brands, ({ one, many }) => ({
  workspace: one(workspaces, { fields: [brands.workspaceId], references: [workspaces.id] }),
  competitors: many(competitors),
  scores: many(visibilityScores),
}))

export const promptsRelations = relations(prompts, ({ one, many }) => ({
  workspace: one(workspaces, { fields: [prompts.workspaceId], references: [workspaces.id] }),
  runs: many(promptRuns),
}))

export const promptRunsRelations = relations(promptRuns, ({ one, many }) => ({
  prompt: one(prompts, { fields: [promptRuns.promptId], references: [prompts.id] }),
  mentions: many(mentions),
  citations: many(citations),
}))
