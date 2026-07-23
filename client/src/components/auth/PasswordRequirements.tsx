import { Check } from 'lucide-react'
import { useMemo } from 'react'

import { PASSWORD_RULES } from '@/lib/passwordPolicy'
import { cn } from '@/lib/utils'

interface PasswordRequirementsProps {
  value: string
  className?: string
}

export function PasswordRequirements({ value, className }: PasswordRequirementsProps) {
  const checklist = useMemo(
    () =>
      PASSWORD_RULES.map((rule) => ({
        ...rule,
        met: rule.test(value || ''),
      })),
    [value],
  )

  return (
    <div className={cn('rounded-md border border-border bg-muted/30 px-3 py-2.5', className)}>
      <p className="mb-2 text-xs font-medium text-foreground">Password must include:</p>
      <ul className="grid gap-1.5 sm:grid-cols-2">
        {checklist.map((rule) => (
          <li
            key={rule.id}
            className={cn(
              'flex items-center gap-1.5 text-xs',
              rule.met ? 'text-teal-800' : 'text-muted-foreground',
            )}
          >
            <Check className={cn('h-3.5 w-3.5 shrink-0', rule.met ? 'opacity-100' : 'opacity-30')} />
            {rule.label}
          </li>
        ))}
      </ul>
    </div>
  )
}
