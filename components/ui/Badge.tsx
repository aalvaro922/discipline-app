import { cn } from '@/lib/utils'

interface BadgeProps {
  variant?: 'success' | 'warn' | 'danger' | 'neutral'
  className?: string
  children: React.ReactNode
}

export function Badge({ variant = 'neutral', className, children }: BadgeProps) {
  const variants = {
    success: 'bg-white/10 text-white border border-white/20',
    warn:    'bg-white/5  text-muted border border-white/10',
    danger:  'bg-white/5  text-muted border border-white/5 opacity-60',
    neutral: 'bg-surface-2 text-muted border border-border',
  }

  return (
    <span className={cn('inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium', variants[variant], className)}>
      {children}
    </span>
  )
}
