import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { getUserWorkspaces } from '@/actions/workspace'
import { getCitationsForWorkspace } from '@/actions/run'
import { Link2 } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { EmptyState } from '@/components/shared/EmptyState'

export default async function CitationsPage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  const workspaces = await getUserWorkspaces()
  if (workspaces.length === 0) redirect('/onboarding/workspace')

  const workspace = workspaces[0]
  const domainCounts = await getCitationsForWorkspace(workspace.id)

  const owned = domainCounts.filter((d) => d.isOwned)
  const thirdParty = domainCounts.filter((d) => !d.isOwned)
  const total = domainCounts.reduce((s, d) => s + d.count, 0)
  const ownedTotal = owned.reduce((s, d) => s + d.count, 0)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Citations</h1>
        <p className="text-muted-foreground text-sm mt-1">Domains AI engines cite in their answers</p>
      </div>

      {total === 0 ? (
        <EmptyState
          icon={Link2}
          title="No citations yet"
          description="Run some prompts first to see which domains AI engines cite."
        />
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Total citations</CardDescription>
                <div className="text-3xl font-bold">{total}</div>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Owned domains</CardDescription>
                <div className="text-3xl font-bold text-emerald-600">{ownedTotal}</div>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Citation ownership</CardDescription>
                <div className="text-3xl font-bold">{total > 0 ? Math.round((ownedTotal / total) * 100) : 0}%</div>
              </CardHeader>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Domain frequency</CardTitle>
              <CardDescription>Sorted by citation count</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                {domainCounts.map((d) => (
                  <div key={d.domain} className="flex items-center gap-3 py-2 border-b last:border-0">
                    <div className="flex-1">
                      <span className="text-sm font-medium">{d.domain}</span>
                    </div>
                    {d.isOwned && <Badge variant="secondary" className="text-xs bg-emerald-100 text-emerald-700 border-emerald-200">Owned</Badge>}
                    <span className="text-sm text-muted-foreground tabular-nums">{d.count}</span>
                    <div className="w-24 h-1.5 rounded-full bg-secondary overflow-hidden">
                      <div className="h-full bg-primary rounded-full" style={{ width: `${Math.min(100, (d.count / domainCounts[0].count) * 100)}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
