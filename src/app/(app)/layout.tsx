import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { AppSidebar } from '@/components/layout/AppSidebar'
import { UserMenu } from '@/components/layout/UserMenu'
import { getUserWorkspaces } from '@/actions/workspace'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (!session?.user) redirect('/login')

  const workspaces = await getUserWorkspaces()
  if (workspaces.length === 0) redirect('/onboarding/workspace')

  return (
    <div className="min-h-screen bg-slate-50">
      <AppSidebar />
      <div className="pl-60">
        <header className="h-14 border-b bg-white flex items-center justify-between px-6">
          <div />
          <div className="w-48">
            <UserMenu />
          </div>
        </header>
        <main className="p-6">{children}</main>
      </div>
    </div>
  )
}
