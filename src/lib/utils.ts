import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 50)
}

export function formatScore(score: number): string {
  return Math.round(score).toString()
}

export function getScoreColor(score: number): string {
  if (score >= 70) return 'text-emerald-600'
  if (score >= 40) return 'text-amber-600'
  return 'text-red-600'
}

export function getScoreBg(score: number): string {
  if (score >= 70) return 'bg-emerald-50 text-emerald-700 border-emerald-200'
  if (score >= 40) return 'bg-amber-50 text-amber-700 border-amber-200'
  return 'bg-red-50 text-red-700 border-red-200'
}

export function getSentimentColor(sentiment: string): string {
  switch (sentiment) {
    case 'positive': return 'bg-emerald-100 text-emerald-700'
    case 'neutral': return 'bg-slate-100 text-slate-600'
    case 'negative': return 'bg-red-100 text-red-700'
    case 'risky': return 'bg-orange-100 text-orange-700'
    default: return 'bg-slate-100 text-slate-600'
  }
}

export function getRoleColor(role: string): string {
  switch (role) {
    case 'recommended': return 'bg-blue-100 text-blue-700'
    case 'mentioned': return 'bg-slate-100 text-slate-600'
    case 'compared': return 'bg-purple-100 text-purple-700'
    default: return 'bg-slate-100 text-slate-600'
  }
}

export function getEngineLabel(engine: string): string {
  const labels: Record<string, string> = {
    chatgpt: 'ChatGPT',
    perplexity: 'Perplexity',
    gemini: 'Gemini',
    claude: 'Claude',
    grok: 'Grok',
  }
  return labels[engine] ?? engine
}

export function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export function formatRelativeTime(dateString: string): string {
  const now = new Date()
  const date = new Date(dateString)
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return 'just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`
  return formatDate(dateString)
}
