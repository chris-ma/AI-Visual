'use client'
import Link from 'next/link'
import { TrendingUp, TrendingDown, Minus, Activity, MessageSquare, ExternalLink } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { EngineIcon } from '@/components/shared/EngineIcon'
import { EmptyState } from '@/components/shared/EmptyState'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { formatRelativeTime, getScoreColor } from '@/lib/utils'
import type { WorkspaceWithRole, Brand, VisibilityScore } from '@/types'

interface Props {
  workspace: WorkspaceWithRole
  brand: Brand | null
  scores: VisibilityScore[]
  recentRuns: { id: string; promptText: string; engine: string; timestamp: string; status: string }[]
}

const SCORE_ITEMS = [
  { key: 'presenceScore', label: 'Presence', weight: '30%' },
  { key: 'recommendationScore', label: 'Recommendation', weight: '20%' },
  { key: 'prominenceScore', label: 'Prominence', weight: '15%' },
  { key: 'citationScore', label: 'Citation ownership', weight: '15%' },
  { key: 'narrativeScore', label: 'Narrative quality', weight: '10%' },
  { key: 'competitiveShare', label: 'Competitive share', weight: '10%' },
] as const

export function DashboardClient({ workspace, brand, scores, recentRuns }: Props) {
  const latestScore = scores[0]
  const previousScore = scores[1]

  const scoreDelta = latestScore && previousScore
    ? latestScore.overallScore - previousScore.overallScore
    : null

  const trendData = scores
    .slice(0, 14)
    .reverse()
    .map((s, i) => ({
      day: `Day ${i + 1}`,
      overall: Math.round(s.overallScore),
      presence: Math.round(s.presenceScore),
    }))

  if (!brand) {
    return (
      <EmptyState
        icon={Activity}
        title="Set up your brand profile"
        description="Add your brand details and competitors to start tracking AI visibility."
        action={{ label: 'Set up brand', onClick: () => window.location.href = '/settings/brand' }}
      />
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{brand.name} — AI Visibility</h1>
        <p className="text-muted-foreground text-sm mt-1">{workspace.name}</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="col-span-2">
          <CardHeader className="pb-2">
            <CardDescription>Overall Visibility Score</CardDescription>
            <div className="flex items-end gap-3">
              <span className={`text-5xl font-bold tabular-nums ${getScoreColor(latestScore?.overallScore ?? 0)}`}>
                {latestScore ? Math.round(latestScore.overallScore) : '—'}
              </span>
              {scoreDelta !== null && (
                <span className={`text-sm font-medium mb-1 flex items-center gap-1 ${scoreDelta > 0 ? 'text-emerald-600' : scoreDelta < 0 ? 'text-red-600' : 'text-slate-500'}`}>
                  {scoreDelta > 0 ? <TrendingUp className="h-4 w-4" /> : scoreDelta < 0 ? <TrendingDown className="h-4 w-4" /> : <Minus className="h-4 w-4" />}
                  {scoreDelta > 0 ? '+' : ''}{scoreDelta.toFixed(1)}
                </span>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {SCORE_ITEMS.map(({ key, label, weight }) => (
              <div key={key} className="flex items-center gap-3">
                <span className="text-xs text-muted-foreground w-36 shrink-0">{label}</span>
                <Progress value={latestScore ? (latestScore[key] as number) : 0} className="flex-1 h-1.5" />
                <span className="text-xs font-mono w-8 text-right">{latestScore ? Math.round(latestScore[key] as number) : 0}</span>
                <span className="text-[10px] text-muted-foreground w-8">{weight}</span>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Prompts run (30d)</CardDescription>
            <div className="text-3xl font-bold">{latestScore?.runCount ?? 0}</div>
          </CardHeader>
          <CardContent>
            <Link href="/prompts">
              <Button variant="outline" size="sm" className="w-full">Run more prompts</Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Competitors tracked</CardDescription>
            <div className="text-3xl font-bold">{brand ? 'Active' : '0'}</div>
          </CardHeader>
          <CardContent>
            <Link href="/competitors">
              <Button variant="outline" size="sm" className="w-full">View comparison</Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      {trendData.length > 1 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Score trend</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="day" tick={{ fontSize: 11 }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Line type="monotone" dataKey="overall" stroke="#2563eb" strokeWidth={2} dot={false} name="Overall" />
                <Line type="monotone" dataKey="presence" stroke="#10b981" strokeWidth={1.5} dot={false} name="Presence" strokeDasharray="4 2" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <CardTitle className="text-base">Recent runs</CardTitle>
          <Link href="/prompts" className="text-sm text-primary hover:underline">View all</Link>
        </CardHeader>
        <CardContent>
          {recentRuns.length === 0 ? (
            <div className="text-center py-8">
              <MessageSquare className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">No runs yet. Go to Prompts to run your first query.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {recentRuns.map((run) => (
                <div key={run.id} className="flex items-center gap-3 py-2 border-b last:border-0">
                  <EngineIcon engine={run.engine as any} />
                  <span className="flex-1 text-sm truncate">{run.promptText}</span>
                  <Badge
                    variant={run.status === 'completed' ? 'secondary' : run.status === 'failed' ? 'destructive' : 'outline'}
                    className="shrink-0"
                  >
                    {run.status}
                  </Badge>
                  <span className="text-xs text-muted-foreground shrink-0">{formatRelativeTime(run.timestamp)}</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
