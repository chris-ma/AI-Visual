import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { getUserWorkspaces } from '@/actions/workspace'
import { getBrandForWorkspace } from '@/actions/brand'
import { getVisibilityScores, getRecentRunsForWorkspace } from '@/actions/run'
import { DashboardClient } from './DashboardClient'

export default async function DashboardPage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  const workspaces = await getUserWorkspaces()
  if (workspaces.length === 0) redirect('/onboarding/workspace')

  const workspace = workspaces[0]
  const brand = await getBrandForWorkspace(workspace.id)

  const scores = brand ? await getVisibilityScores(workspace.id, brand.id) : []
  const recentRuns = await getRecentRunsForWorkspace(workspace.id)

  return (
    <DashboardClient
      workspace={workspace}
      brand={brand}
      scores={scores}
      recentRuns={recentRuns}
    />
  )
}
