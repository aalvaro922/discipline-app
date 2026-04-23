import { cn } from '@/lib/utils'

interface HeaderProps {
  title: string
  subtitle?: string
  right?: React.ReactNode
  className?: string
}

export function Header({ title, subtitle, right, className }: HeaderProps) {
  return (
    <header className={cn('pt-safe px-5 pt-4 pb-3 flex items-center justify-between', className)}>
      <div>
        <h1 className="text-xl font-bold tracking-tight">{title}</h1>
        {subtitle && <p className="text-sm text-muted mt-0.5">{subtitle}</p>}
      </div>
      {right && <div className="flex items-center gap-2">{right}</div>}
    </header>
  )
}
