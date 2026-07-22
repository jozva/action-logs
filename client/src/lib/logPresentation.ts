import type { LogStatus, Severity } from '@/constants/logs'

export function severityBadgeVariant(severity: Severity) {
  switch (severity) {
    case 'critical':
      return 'critical' as const
    case 'high':
      return 'high' as const
    case 'medium':
      return 'medium' as const
    case 'low':
      return 'low' as const
    case 'info':
      return 'info' as const
    default:
      return 'default' as const
  }
}

export function statusBadgeVariant(status: LogStatus) {
  switch (status) {
    case 'success':
      return 'success' as const
    case 'failure':
      return 'danger' as const
    case 'blocked':
      return 'critical' as const
    case 'pending':
      return 'warning' as const
    default:
      return 'muted' as const
  }
}

export function formatLabel(value: string): string {
  return value.replaceAll('_', ' ')
}
