import type { Mention, Citation, ScoreBreakdown } from '@/types'

const WEIGHTS = { presence: 0.30, recommendation: 0.20, prominence: 0.15, citation: 0.15, narrative: 0.10, competitive: 0.10 }
const PROMINENCE_VALUES: Record<string, number> = { high: 1.0, medium: 0.6, low: 0.2 }
const SENTIMENT_VALUES: Record<string, number> = { positive: 1.0, neutral: 0.5, negative: 0.0, risky: 0.1 }

export function calculateScoreBreakdown(
  brandMentions: Mention[],
  allMentions: Mention[],
  citations: Citation[],
  totalRuns: number
): ScoreBreakdown {
  if (totalRuns === 0) {
    return { presence: 0, recommendation: 0, prominence: 0, citation: 0, narrative: 0, competitive: 0, overall: 0 }
  }

  const runsWithBrand = new Set(brandMentions.map((m) => m.promptRunId)).size
  const presence = (runsWithBrand / totalRuns) * 100

  const runsWithRecommendation = new Set(
    brandMentions.filter((m) => m.role === 'recommended').map((m) => m.promptRunId)
  ).size
  const recommendation = (runsWithRecommendation / totalRuns) * 100

  const totalConfidence = brandMentions.reduce((sum, m) => sum + m.confidence, 0)
  const prominenceScore =
    brandMentions.length > 0 && totalConfidence > 0
      ? (brandMentions.reduce((sum, m) => sum + PROMINENCE_VALUES[m.prominence] * m.confidence, 0) / totalConfidence) * 100
      : 0

  const ownedCitations = citations.filter((c) => c.isOwned).length
  const citationScore = citations.length > 0 ? (ownedCitations / citations.length) * 100 : 50

  const narrativeScore =
    brandMentions.length > 0
      ? (brandMentions.reduce((sum, m) => sum + SENTIMENT_VALUES[m.sentiment], 0) / brandMentions.length) * 100
      : 0

  const competitiveShare = allMentions.length > 0 ? (brandMentions.length / allMentions.length) * 100 : 0

  const overall =
    presence * WEIGHTS.presence +
    recommendation * WEIGHTS.recommendation +
    prominenceScore * WEIGHTS.prominence +
    citationScore * WEIGHTS.citation +
    narrativeScore * WEIGHTS.narrative +
    competitiveShare * WEIGHTS.competitive

  return {
    presence: round(presence),
    recommendation: round(recommendation),
    prominence: round(prominenceScore),
    citation: round(citationScore),
    narrative: round(narrativeScore),
    competitive: round(competitiveShare),
    overall: round(overall),
  }
}

function round(n: number): number {
  return Math.round(n * 10) / 10
}
