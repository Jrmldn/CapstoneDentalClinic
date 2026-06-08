import { cn } from '@/lib/utils'

export function PageShell({ children, className }: { children: React.ReactNode, className?: string }) {
  return (
    <div className={cn("min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4", className)}>
      {children}
    </div>
  )
}
