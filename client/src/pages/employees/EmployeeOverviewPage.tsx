import { Link } from 'react-router-dom'

import { Badge } from '@/components/ui/badge'
import { buttonVariants } from '@/components/ui/button'
import { useAuthStore } from '@/stores/authStore'
import { cn } from '@/lib/utils'

export default function EmployeeOverviewPage() {
  const { user, hasPermission } = useAuthStore()

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <article className="rounded-lg border border-border bg-card-solid/90 p-5 shadow-sm">
        <h3 className="text-lg font-semibold">Signed-in employee</h3>
        <div className="mt-3 space-y-2 text-sm">
          <p>
            <span className="text-muted-foreground">Name:</span> {user?.name}
          </p>
          <p>
            <span className="text-muted-foreground">Email:</span> {user?.email}
          </p>
          <p className="flex items-center gap-2">
            <span className="text-muted-foreground">Role:</span>
            <Badge>{user?.role}</Badge>
          </p>
          <p className="flex items-center gap-2">
            <span className="text-muted-foreground">Region:</span>
            <span className="font-mono text-xs">{user?.region}</span>
            <Badge variant="muted">auto-detected</Badge>
          </p>
        </div>
      </article>

      <article className="rounded-lg border border-border bg-card-solid/90 p-5 shadow-sm">
        <h3 className="text-lg font-semibold">What you can do</h3>
        <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
          <li>Login / logout are audited as SESSION events</li>
          <li>Create account registers a standard `user` role</li>
          <li>Admins can create, update, and delete users</li>
          <li>Files, exports, and policies enforce RBAC on the server</li>
          <li>File upload/download and JSON log export are audited</li>
        </ul>
        <div className="mt-4 flex flex-wrap gap-2">
          {hasPermission('user:create') ? (
            <Link to="/employees/users" className={cn(buttonVariants({ size: 'sm' }))}>
              Manage users
            </Link>
          ) : null}
          {hasPermission('file:upload') ? (
            <Link
              to="/employees/files"
              className={cn(buttonVariants({ size: 'sm', variant: 'outline' }))}
            >
              Upload files
            </Link>
          ) : null}
          <Link to="/" className={cn(buttonVariants({ size: 'sm', variant: 'ghost' }))}>
            View audit dashboard
          </Link>
        </div>
      </article>
    </div>
  )
}
