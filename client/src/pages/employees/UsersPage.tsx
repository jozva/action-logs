import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Eye, EyeOff, Plus, UserPlus, Users } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'

import { ApiRequestError } from '@/api/httpClient'
import { createUser, deleteUser, fetchUsers, updateUser } from '@/api/usersApi'
import { PasswordRequirements } from '@/components/auth/PasswordRequirements'
import { TableSkeleton } from '@/components/common/LoadingState'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dialog } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { ACTOR_ROLES } from '@/constants/logs'
import { formatLabel } from '@/lib/logPresentation'
import { strongPasswordSchema } from '@/lib/passwordPolicy'
import { useAuthStore } from '@/stores/authStore'

const ROLE_HELP: Record<(typeof ACTOR_ROLES)[number], string> = {
  admin: 'Full access — manage users, policies, and all workspace actions.',
  auditor: 'Read users/files/policies and export data. Cannot create users.',
  user: 'Standard employee — update own profile, upload/download files.',
  viewer: 'Read-only access to users, files, and policies.',
  service: 'Automation identity for file and export workflows.',
}

const createSchema = z
  .object({
    name: z.string().trim().min(2, 'Name must be at least 2 characters').max(120),
    email: z.string().trim().email('Enter a valid work email').max(254),
    password: strongPasswordSchema,
    confirmPassword: z.string().min(1, 'Confirm the temporary password'),
    role: z.enum(ACTOR_ROLES),
  })
  .refine((value) => value.password === value.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })

type CreateForm = z.infer<typeof createSchema>

export default function UsersPage() {
  const queryClient = useQueryClient()
  const { user, hasPermission } = useAuthStore()
  const [createOpen, setCreateOpen] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [editRole, setEditRole] = useState<(typeof ACTOR_ROLES)[number]>('user')
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null)

  const usersQuery = useQuery({
    queryKey: ['users'],
    queryFn: fetchUsers,
  })

  const form = useForm<CreateForm>({
    resolver: zodResolver(createSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
      role: 'user',
    },
    mode: 'onBlur',
  })

  const passwordValue = form.watch('password')
  const selectedRole = form.watch('role')

  const createMutation = useMutation({
    mutationFn: (values: CreateForm) =>
      createUser({
        name: values.name,
        email: values.email,
        password: values.password,
        role: values.role,
      }),
    onSuccess: async (created) => {
      toast.success(`Created ${created.name}`, {
        description: `${created.email} · ${formatLabel(created.role)}`,
      })
      form.reset({ name: '', email: '', password: '', confirmPassword: '', role: 'user' })
      setShowPassword(false)
      setCreateOpen(false)
      await queryClient.invalidateQueries({ queryKey: ['users'] })
      await queryClient.invalidateQueries({ queryKey: ['logs'] })
    },
    onError: (error: unknown) => {
      const message = error instanceof ApiRequestError ? error.message : 'Create failed'
      toast.error(message)
      if (error instanceof ApiRequestError && error.status === 409) {
        form.setError('email', { message: 'An account with this email already exists' })
      }
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, name, role }: { id: string; name: string; role: CreateForm['role'] }) =>
      updateUser(id, { name, role }),
    onSuccess: async () => {
      toast.success('User updated')
      setEditingId(null)
      await queryClient.invalidateQueries({ queryKey: ['users'] })
      await queryClient.invalidateQueries({ queryKey: ['logs'] })
    },
    onError: (error: unknown) => {
      toast.error(error instanceof ApiRequestError ? error.message : 'Update failed')
    },
  })

  const deleteMutation = useMutation({
    mutationFn: deleteUser,
    onSuccess: async () => {
      toast.success('User deactivated from directory')
      setPendingDeleteId(null)
      await queryClient.invalidateQueries({ queryKey: ['users'] })
      await queryClient.invalidateQueries({ queryKey: ['logs'] })
    },
    onError: (error: unknown) => {
      toast.error(error instanceof ApiRequestError ? error.message : 'Delete failed')
    },
  })

  const users = usersQuery.data ?? []
  const canCreate = hasPermission('user:create')

  if (usersQuery.isLoading) {
    return <TableSkeleton />
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold tracking-tight">Directory</h3>
          <p className="text-sm text-muted-foreground">
            Provision accounts, assign roles, and revoke access. Creates are audited.
          </p>
        </div>
        {canCreate ? (
          <Button type="button" onClick={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4" />
            Create user
          </Button>
        ) : null}
      </div>

      {usersQuery.isError ? (
        <section className="rounded-lg border border-danger/30 bg-red-50 px-4 py-6 text-sm text-danger">
          <p className="font-medium">Could not load users</p>
          <p className="mt-1 text-danger/80">
            {usersQuery.error instanceof ApiRequestError
              ? usersQuery.error.message
              : 'Unexpected error'}
          </p>
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="mt-3"
            onClick={() => void usersQuery.refetch()}
          >
            Retry
          </Button>
        </section>
      ) : users.length === 0 ? (
        <section className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border bg-card-solid/60 px-6 py-16 text-center">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-teal-50 text-teal-800">
            <Users className="h-5 w-5" />
          </div>
          <p className="text-base font-semibold">No users in directory</p>
          <p className="mt-1 max-w-sm text-sm text-muted-foreground">
            {canCreate
              ? 'Create the first employee account to start assigning workspace access.'
              : 'Ask an administrator to provision your team.'}
          </p>
          {canCreate ? (
            <Button type="button" className="mt-4" onClick={() => setCreateOpen(true)}>
              <UserPlus className="h-4 w-4" />
              Create first user
            </Button>
          ) : null}
        </section>
      ) : (
        <section className="overflow-hidden rounded-lg border border-border bg-card-solid/90 shadow-sm">
          <div className="overflow-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Email</th>
                  <th className="px-4 py-3">Role</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((item) => (
                  <tr key={item.id} className="border-t border-border">
                    <td className="px-4 py-3">
                      {editingId === item.id ? (
                        <Input value={editName} onChange={(e) => setEditName(e.target.value)} />
                      ) : (
                        <div>
                          <p className="font-medium">{item.name}</p>
                          {item.id === user?.id ? (
                            <p className="text-xs text-muted-foreground">You</p>
                          ) : null}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs">{item.email}</td>
                    <td className="px-4 py-3">
                      {editingId === item.id && canCreate ? (
                        <Select
                          value={editRole}
                          onChange={(e) =>
                            setEditRole(e.target.value as (typeof ACTOR_ROLES)[number])
                          }
                        >
                          {ACTOR_ROLES.map((role) => (
                            <option key={role} value={role}>
                              {formatLabel(role)}
                            </option>
                          ))}
                        </Select>
                      ) : (
                        <Badge>{formatLabel(item.role)}</Badge>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={item.status === 'active' ? 'success' : 'muted'}>
                        {item.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-2">
                        {editingId === item.id ? (
                          <>
                            <Button
                              size="sm"
                              disabled={updateMutation.isPending || editName.trim().length < 2}
                              onClick={() =>
                                updateMutation.mutate({
                                  id: item.id,
                                  name: editName.trim(),
                                  role: editRole,
                                })
                              }
                            >
                              Save
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => setEditingId(null)}>
                              Cancel
                            </Button>
                          </>
                        ) : (
                          <>
                            {hasPermission('user:update') &&
                            (user?.role === 'admin' || user?.id === item.id) ? (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setEditingId(item.id)
                                  setEditName(item.name)
                                  setEditRole(item.role)
                                }}
                              >
                                Edit
                              </Button>
                            ) : null}
                            {hasPermission('user:delete') && user?.id !== item.id ? (
                              pendingDeleteId === item.id ? (
                                <>
                                  <Button
                                    size="sm"
                                    variant="danger"
                                    disabled={deleteMutation.isPending}
                                    onClick={() => deleteMutation.mutate(item.id)}
                                  >
                                    Confirm delete
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => setPendingDeleteId(null)}
                                  >
                                    Cancel
                                  </Button>
                                </>
                              ) : (
                                <Button
                                  size="sm"
                                  variant="danger"
                                  onClick={() => setPendingDeleteId(item.id)}
                                >
                                  Delete
                                </Button>
                              )
                            ) : null}
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      <Dialog
        open={createOpen}
        onClose={() => {
          if (!createMutation.isPending) {
            setCreateOpen(false)
            form.reset({ name: '', email: '', password: '', confirmPassword: '', role: 'user' })
            setShowPassword(false)
          }
        }}
        title="Create user"
        description="Provision a new account with a temporary password. The action is written to the audit log."
      >
        <form
          className="space-y-4"
          onSubmit={form.handleSubmit((values) => createMutation.mutate(values))}
        >
          <div className="space-y-1.5">
            <Label htmlFor="create-name">Full name</Label>
            <Input id="create-name" autoComplete="name" {...form.register('name')} />
            {form.formState.errors.name ? (
              <p className="text-xs text-danger">{form.formState.errors.name.message}</p>
            ) : null}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="create-email">Work email</Label>
            <Input
              id="create-email"
              type="email"
              autoComplete="off"
              {...form.register('email')}
            />
            {form.formState.errors.email ? (
              <p className="text-xs text-danger">{form.formState.errors.email.message}</p>
            ) : null}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="create-role">Role</Label>
            <Select id="create-role" {...form.register('role')}>
              {ACTOR_ROLES.map((role) => (
                <option key={role} value={role}>
                  {formatLabel(role)}
                </option>
              ))}
            </Select>
            <p className="text-xs text-muted-foreground">{ROLE_HELP[selectedRole]}</p>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="create-password">Temporary password</Label>
            <div className="relative">
              <Input
                id="create-password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                className="pr-10"
                {...form.register('password')}
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 flex items-center px-3 text-muted-foreground hover:text-foreground"
                onClick={() => setShowPassword((value) => !value)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {form.formState.errors.password ? (
              <p className="text-xs text-danger">{form.formState.errors.password.message}</p>
            ) : (
              <p className="text-xs text-muted-foreground">
                Share this temporary password securely. Requirements update as you type.
              </p>
            )}
            <PasswordRequirements value={passwordValue} className="mt-2" />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="create-confirm">Confirm password</Label>
            <Input
              id="create-confirm"
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
              {...form.register('confirmPassword')}
            />
            {form.formState.errors.confirmPassword ? (
              <p className="text-xs text-danger">{form.formState.errors.confirmPassword.message}</p>
            ) : null}
          </div>

          <div className="flex items-center justify-end gap-2 border-t border-border pt-4">
            <Button
              type="button"
              variant="outline"
              disabled={createMutation.isPending}
              onClick={() => setCreateOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending ? 'Creating…' : 'Create user'}
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  )
}
