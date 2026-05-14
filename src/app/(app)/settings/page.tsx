import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { getUserWorkspaces } from '@/actions/workspace'
import { getBrandForWorkspace, getCompetitorsForBrand } from '@/actions/brand'
import { SettingsClient } from './SettingsClient'

export default async function SettingsPage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/auth/login')

  const workspaces = await getUserWorkspaces()
  if (workspaces.length === 0) redirect('/onboarding/workspace')

  const workspace = workspaces[0]
  const brand = await getBrandForWorkspace(workspace.id)
  const competitors = brand ? await getCompetitorsForBrand(brand.id) : []

  return <SettingsClient workspace={workspace} brand={brand} competitors={competitors} />
}
