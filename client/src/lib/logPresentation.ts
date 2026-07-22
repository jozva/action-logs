import type { LogStatus, Severity } from '@/constants/logs'

export function severityBadgeVariant(severity: Severity) {
  switch (severity) {
    case 'CRITICAL':
      return 'critical' as const
    case 'HIGH':
      return 'high' as const
    case 'MEDIUM':
      return 'medium' as const
    case 'LOW':
      return 'low' as const
    case 'INFO':
      return 'info' as const
    default:
      return 'default' as const
  }
}

export function statusBadgeVariant(status: LogStatus) {
  switch (status) {
    case 'Resolved':
      return 'success' as const
    case 'Unresolved':
      return 'danger' as const
    case 'Investigating':
      return 'warning' as const
    case 'Dismissed':
      return 'muted' as const
    default:
      return 'muted' as const
  }
}

export function formatLabel(value: string): string {
  return value.replaceAll('_', ' ')
}
