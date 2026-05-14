import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { getUserWorkspaces } from '@/actions/workspace'
import { getBrandForWorkspace, getCompetitorsForBrand } from '@/actions/brand'
import { getMentionsByEntityForWorkspace } from '@/actions/run'
import { CompetitorsClient } from './CompetitorsClient'

export default async function CompetitorsPage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/auth/login')

  const workspaces = await getUserWorkspaces()
  if (workspaces.length === 0) redirect('/onboarding/workspace')

  const workspace = workspaces[0]
  const brand = await getBrandForWorkspace(workspace.id)
  const competitors = brand ? await getCompetitorsForBrand(brand.id) : []
  const mentionCounts = await getMentionsByEntityForWorkspace(workspace.id)

  return <CompetitorsClient brand={brand} competitors={competitors} mentionCounts={mentionCounts} workspaceId={workspace.id} />
}
