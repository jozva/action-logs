import {
  Database,
  FileText,
  LayoutDashboard,
  Shield,
  Users,
} from 'lucide-react'
import { NavLink, Outlet } from 'react-router-dom'

import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/stores/authStore'

const links = [
  { to: '/employees', label: 'Overview', icon: LayoutDashboard, end: true },
  { to: '/employees/users', label: 'Users', icon: Users, permission: 'user:read' },
  { to: '/employees/files', label: 'Files', icon: FileText, permission: 'file:read' },
  { to: '/employees/exports', label: 'Exports', icon: Database, permission: 'export:create' },
  { to: '/employees/policies', label: 'Policies', icon: Shield, permission: 'policy:read' },
] as const

export function EmployeeWorkspaceLayout() {
  const { user, hasPermission } = useAuthStore()

  return (
    <div className="mx-auto flex max-w-[1400px] flex-col gap-6">
      <section className="flex flex-col gap-3 rounded-lg border border-border bg-card-solid/90 p-4 shadow-sm md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Employee Workspace</h2>
          <p className="text-sm text-muted-foreground">
            Real operational pages. Every mutation is role-checked and audited on the server.
          </p>
        </div>
        {user ? (
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <span className="font-medium">{user.name}</span>
            <Badge>{user.role}</Badge>
            <span className="font-mono text-xs text-muted-foreground">{user.email}</span>
          </div>
        ) : null}
      </section>

      <nav className="flex flex-wrap gap-2">
        {links.map((link) => {
          if ('permission' in link && link.permission && !hasPermission(link.permission)) {
            return null
          }

          return (
            <NavLink
              key={link.to}
              to={link.to}
              end={'end' in link ? link.end : false}
              className={({ isActive }) =>
                cn(
                  'inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm transition-colors',
                  isActive
                    ? 'border-teal-700 bg-teal-50 text-teal-900'
                    : 'border-border bg-card-solid text-muted-foreground hover:text-foreground',
                )
              }
            >
              <link.icon className="h-4 w-4" />
              {link.label}
            </NavLink>
          )
        })}
      </nav>

      <Outlet />
    </div>
  )
}
