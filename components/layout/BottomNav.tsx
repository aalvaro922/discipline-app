'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, CheckSquare, History, BarChart2, Settings } from 'lucide-react'
import { cn } from '@/lib/utils'

const nav = [
  { href: '/',         label: 'Inicio',    Icon: LayoutDashboard },
  { href: '/tasks',    label: 'Tareas',    Icon: CheckSquare     },
  { href: '/history',  label: 'Historial', Icon: History         },
  { href: '/stats',    label: 'Stats',     Icon: BarChart2       },
  { href: '/settings', label: 'Config',    Icon: Settings        },
]

export function BottomNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 inset-x-0 z-40 bg-surface/90 backdrop-blur-md border-t border-border pb-safe">
      <ul className="flex items-center justify-around h-16 max-w-lg mx-auto">
        {nav.map(({ href, label, Icon }) => {
          const active = pathname === href || (href !== '/' && pathname.startsWith(href))
          return (
            <li key={href} className="flex-1">
              <Link
                href={href}
                className={cn(
                  'flex flex-col items-center gap-0.5 py-2 text-xs font-medium transition-colors',
                  active ? 'text-white' : 'text-muted hover:text-zinc-400'
                )}
              >
                <Icon size={21} strokeWidth={active ? 2.2 : 1.7} />
                <span className="text-[10px]">{label}</span>
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
