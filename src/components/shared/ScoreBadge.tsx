import { cn, getScoreBg } from '@/lib/utils'

export function ScoreBadge({ score, className }: { score: number; className?: string }) {
  return (
    <span className={cn('inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold', getScoreBg(score), className)}>
      {Math.round(score)}
    </span>
  )
}
