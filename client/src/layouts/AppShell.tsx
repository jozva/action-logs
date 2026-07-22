import { Activity, LogIn, LogOut, Menu, ShieldCheck, Upload, Users } from 'lucide-react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'

import { logoutRequest } from '@/api/authApi'
import { ApiRequestError } from '@/api/httpClient'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/stores/authStore'
import { useUiStore } from '@/stores/uiStore'

const navItems = [
  { to: '/', label: 'Dashboard', icon: Activity },
  { to: '/employees', label: 'Employees', icon: Users },
  { to: '/upload', label: 'Bulk Upload', icon: Upload },
]

export function AppShell() {
  const navigate = useNavigate()
  const { sidebarCollapsed, toggleSidebar } = useUiStore()
  const { user, token, clearSession } = useAuthStore()

  const handleLogout = async () => {
    try {
      if (token) {
        await logoutRequest()
      }
    } catch (error) {
      if (!(error instanceof ApiRequestError && error.status === 401)) {
        toast.error(error instanceof ApiRequestError ? error.message : 'Logout failed')
      }
    } finally {
      clearSession()
      toast.success('Signed out')
      navigate('/login')
    }
  }

  return (
    <div className="flex min-h-screen">
      <aside
        className={cn(
          'sticky top-0 hidden h-screen shrink-0 flex-col border-r border-teal-950/40 bg-sidebar text-sidebar-foreground transition-[width] duration-300 md:flex',
          sidebarCollapsed ? 'w-[76px]' : 'w-64',
        )}
      >
        <div className="flex items-center gap-3 border-b border-white/10 px-4 py-5">
          <div className="flex h-10 w-10 items-center justify-center rounded-md bg-teal-700 text-white">
            <ShieldCheck className="h-5 w-5" />
          </div>
          {!sidebarCollapsed ? (
            <div className="overflow-hidden">
              <p className="truncate text-sm font-semibold tracking-wide">Gidy Security</p>
              <p className="truncate text-xs text-sidebar-muted">Audit Monitoring</p>
            </div>
          ) : null}
        </div>

        <nav className="flex flex-1 flex-col gap-1 p-3">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 rounded-md px-3 py-2.5 text-sm transition-colors',
                  isActive
                    ? 'bg-sidebar-accent text-white'
                    : 'text-sidebar-muted hover:bg-white/5 hover:text-white',
                )
              }
            >
              <item.icon className="h-4 w-4 shrink-0" />
              {!sidebarCollapsed ? <span>{item.label}</span> : null}
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-white/10 p-3 text-xs text-sidebar-muted">
          {!sidebarCollapsed ? (
            user ? (
              <div className="space-y-1">
                <p className="truncate font-medium text-sidebar-foreground">{user.name}</p>
                <p className="truncate">{user.role}</p>
              </div>
            ) : (
              <p>Sign in for employee actions</p>
            )
          ) : (
            <p className="text-center">v1</p>
          )}
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 border-b border-border/80 bg-white/80 px-4 py-3 backdrop-blur md:px-6">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                className="hidden md:inline-flex"
                onClick={toggleSidebar}
                aria-label="Toggle sidebar"
              >
                <Menu className="h-4 w-4" />
              </Button>
              <div>
                <p className="text-xs font-medium uppercase tracking-[0.18em] text-teal-800">
                  Gidy Security
                </p>
                <h1 className="text-lg font-semibold tracking-tight md:text-xl">
                  Security Operations Console
                </h1>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="hidden items-center gap-2 md:flex">
                {navItems.map((item) => (
                  <NavLink key={item.to} to={item.to} end={item.to === '/'}>
                    {({ isActive }) => (
                      <Button variant={isActive ? 'default' : 'outline'} size="sm">
                        <item.icon className="h-3.5 w-3.5" />
                        {item.label}
                      </Button>
                    )}
                  </NavLink>
                ))}
              </div>

              {user ? (
                <Button variant="outline" size="sm" onClick={() => void handleLogout()}>
                  <LogOut className="h-3.5 w-3.5" />
                  Logout
                </Button>
              ) : (
                <Button size="sm" onClick={() => navigate('/login')}>
                  <LogIn className="h-3.5 w-3.5" />
                  Login
                </Button>
              )}
            </div>
          </div>
        </header>

        <main className="flex-1 px-4 py-6 md:px-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
