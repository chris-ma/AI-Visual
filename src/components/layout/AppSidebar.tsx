'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, MessageSquare, Users, Link2, Bell, Settings } from 'lucide-react'
import { cn } from '@/lib/utils'

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/prompts', label: 'Prompts', icon: MessageSquare },
  { href: '/competitors', label: 'Competitors', icon: Users },
  { href: '/citations', label: 'Citations', icon: Link2 },
  { href: '/alerts', label: 'Alerts', icon: Bell },
  { href: '/settings', label: 'Settings', icon: Settings },
]

export function AppSidebar() {
  const pathname = usePathname()

  return (
    <aside className="fixed inset-y-0 left-0 z-40 w-60 flex flex-col" style={{ background: '#f5f8ff', borderRight: '1px solid #c5d8ee' }}>
      <div className="h-14 flex items-center px-4" style={{ borderBottom: '1px solid #c5d8ee' }}>
        <div className="flex items-center gap-2.5">
          <div className="h-7 w-7 rounded-xl flex items-center justify-center" style={{ background: '#4a6fa5' }}>
            <span className="text-white text-[10px] font-bold">AI</span>
          </div>
          <span className="font-semibold text-sm" style={{ color: '#1a2b4a' }}>AI Visibility</span>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + '/')
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors',
                active
                  ? 'text-white'
                  : 'hover:bg-blue-50'
              )}
              style={active ? { background: '#4a6fa5', color: '#fff' } : { color: '#6b8ab8' }}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {label}
            </Link>
          )
        })}
      </nav>

      {/* Decorative sphere at bottom of sidebar */}
      <div className="relative h-32 overflow-hidden">
        <div className="absolute -bottom-8 -left-8 w-32 h-32 rounded-full" style={{ background: '#c5d8ee', opacity: 0.5 }} />
        <div className="absolute -bottom-4 left-12 w-16 h-16 rounded-full" style={{ background: '#4a6fa5', opacity: 0.25 }} />
      </div>
    </aside>
  )
}
