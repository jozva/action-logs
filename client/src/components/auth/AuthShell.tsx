import type { ReactNode } from 'react'
import { ShieldCheck } from 'lucide-react'

export function AuthShell({
  title,
  subtitle,
  children,
}: {
  title: string
  subtitle: string
  children: ReactNode
}) {
  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className="w-full max-w-md rounded-lg border border-border bg-card-solid/95 p-6 shadow-sm">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-md bg-teal-700 text-white">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-teal-800">
              Gidy Security
            </p>
            <h1 className="text-xl font-semibold tracking-tight">{title}</h1>
          </div>
        </div>
        <p className="mb-5 text-sm text-muted-foreground">{subtitle}</p>
        {children}
      </div>
    </div>
  )
}
