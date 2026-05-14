import { cn } from '@/lib/utils'
import type { AIEngine } from '@/types'

const ENGINE_COLORS: Record<AIEngine, string> = {
  chatgpt: 'bg-emerald-100 text-emerald-700',
  perplexity: 'bg-blue-100 text-blue-700',
  gemini: 'bg-purple-100 text-purple-700',
  claude: 'bg-orange-100 text-orange-700',
  grok: 'bg-slate-100 text-slate-700',
}

const ENGINE_INITIALS: Record<AIEngine, string> = {
  chatgpt: 'GPT',
  perplexity: 'PPX',
  gemini: 'GEM',
  claude: 'CLD',
  grok: 'GRK',
}

export function EngineIcon({ engine, size = 'sm' }: { engine: AIEngine; size?: 'sm' | 'md' }) {
  return (
    <span
      className={cn(
        'inline-flex items-center justify-center rounded font-mono font-semibold',
        ENGINE_COLORS[engine],
        size === 'sm' ? 'h-6 w-12 text-[10px]' : 'h-8 w-16 text-xs'
      )}
    >
      {ENGINE_INITIALS[engine]}
    </span>
  )
}
