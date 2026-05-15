import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { getUserWorkspaces } from '@/actions/workspace'
import { getPromptsForWorkspace } from '@/actions/prompt'
import { PromptsClient } from './PromptsClient'

export default async function PromptsPage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  const workspaces = await getUserWorkspaces()
  if (workspaces.length === 0) redirect('/onboarding/workspace')

  const workspace = workspaces[0]
  const prompts = await getPromptsForWorkspace(workspace.id)

  return <PromptsClient workspace={workspace} initialPrompts={prompts} />
}
