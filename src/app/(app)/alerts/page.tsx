import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { getUserWorkspaces } from '@/actions/workspace'
import { getAlertsForWorkspace } from '@/actions/alert'
import { AlertsClient } from './AlertsClient'

export default async function AlertsPage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/auth/login')

  const workspaces = await getUserWorkspaces()
  if (workspaces.length === 0) redirect('/onboarding/workspace')

  const workspace = workspaces[0]
  const alerts = await getAlertsForWorkspace(workspace.id)

  return <AlertsClient workspace={workspace} initialAlerts={alerts} />
}
