import { cn } from '@/lib/utils'
import { type ButtonHTMLAttributes, forwardRef } from 'react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', loading, className, children, disabled, ...props }, ref) => {
    const base = 'inline-flex items-center justify-center gap-2 font-semibold rounded-xl transition-all active:scale-95 disabled:opacity-40 disabled:pointer-events-none select-none'

    const variants = {
      primary:   'bg-white text-black hover:bg-zinc-100',
      secondary: 'bg-surface-2 text-white border border-border hover:bg-zinc-800',
      danger:    'bg-surface-2 text-zinc-400 border border-border hover:border-zinc-500',
      ghost:     'bg-transparent text-zinc-400 hover:bg-surface-2',
    }

    const sizes = {
      sm: 'h-9  px-4 text-sm',
      md: 'h-12 px-6 text-base',
      lg: 'h-14 px-8 text-base',
    }

    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(base, variants[variant], sizes[size], className)}
        {...props}
      >
        {loading ? (
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-black/20 border-t-black" />
        ) : null}
        {children}
      </button>
    )
  }
)
Button.displayName = 'Button'
