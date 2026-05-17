import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { getUserWorkspaces } from '@/actions/workspace'
import { getBrandForWorkspace } from '@/actions/brand'
import { getVisibilityScores, getRecentRunsForWorkspace } from '@/actions/run'
import { DashboardClient } from './DashboardClient'

export default async function DashboardPage() {
  const session = await auth()
  if (!session?.user?.id) {
    console.log('[dashboard] no session → /login')
    redirect('/login')
  }

  let workspaces
  try {
    workspaces = await getUserWorkspaces()
  } catch (err) {
    console.error('[dashboard] getUserWorkspaces threw:', err instanceof Error ? err.message : String(err))
    redirect('/login')
  }

  if (workspaces.length === 0) {
    console.log('[dashboard] no workspaces → /onboarding/workspace')
    redirect('/onboarding/workspace')
  }

  const workspace = workspaces[0]
  console.log('[dashboard] rendering for workspace', workspace.id)

  let brand = null
  try {
    brand = await getBrandForWorkspace(workspace.id)
  } catch (err) {
    console.error('[dashboard] getBrandForWorkspace threw:', err instanceof Error ? err.message : String(err))
  }

  let scores: Awaited<ReturnType<typeof getVisibilityScores>> = []
  let recentRuns: Awaited<ReturnType<typeof getRecentRunsForWorkspace>> = []
  try {
    scores = brand ? await getVisibilityScores(workspace.id, brand.id) : []
    recentRuns = await getRecentRunsForWorkspace(workspace.id)
  } catch (err) {
    console.error('[dashboard] data fetch threw:', err instanceof Error ? err.message : String(err))
  }

  return (
    <DashboardClient
      workspace={workspace}
      brand={brand}
      scores={scores}
      recentRuns={recentRuns}
    />
  )
}
