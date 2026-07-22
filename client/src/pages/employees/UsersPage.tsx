import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'

import { ApiRequestError } from '@/api/httpClient'
import { createUser, deleteUser, fetchUsers, updateUser } from '@/api/usersApi'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { TableSkeleton } from '@/components/common/LoadingState'
import { ACTOR_ROLES } from '@/constants/logs'
import { formatLabel } from '@/lib/logPresentation'
import { useAuthStore } from '@/stores/authStore'

const createSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
  role: z.enum(ACTOR_ROLES),
})

type CreateForm = z.infer<typeof createSchema>

export default function UsersPage() {
  const queryClient = useQueryClient()
  const { user, hasPermission } = useAuthStore()
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [editRole, setEditRole] = useState<(typeof ACTOR_ROLES)[number]>('user')

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
      role: 'user',
    },
  })

  const createMutation = useMutation({
    mutationFn: createUser,
    onSuccess: async () => {
      toast.success('User created')
      form.reset({ name: '', email: '', password: '', role: 'user' })
      await queryClient.invalidateQueries({ queryKey: ['users'] })
      await queryClient.invalidateQueries({ queryKey: ['logs'] })
    },
    onError: (error: unknown) => {
      toast.error(error instanceof ApiRequestError ? error.message : 'Create failed')
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
      toast.success('User deleted')
      await queryClient.invalidateQueries({ queryKey: ['users'] })
      await queryClient.invalidateQueries({ queryKey: ['logs'] })
    },
    onError: (error: unknown) => {
      toast.error(error instanceof ApiRequestError ? error.message : 'Delete failed')
    },
  })

  if (usersQuery.isLoading) {
    return <TableSkeleton />
  }

  return (
    <div className="space-y-6">
      {hasPermission('user:create') ? (
        <section className="rounded-lg border border-border bg-card-solid/90 p-4 shadow-sm">
          <h3 className="mb-3 text-lg font-semibold">Create account</h3>
          <form
            className="grid gap-3 md:grid-cols-2 xl:grid-cols-5"
            onSubmit={form.handleSubmit((values) => createMutation.mutate(values))}
          >
            <div className="space-y-1.5">
              <Label>Name</Label>
              <Input {...form.register('name')} />
            </div>
            <div className="space-y-1.5">
              <Label>Email</Label>
              <Input type="email" {...form.register('email')} />
            </div>
            <div className="space-y-1.5">
              <Label>Password</Label>
              <Input type="password" {...form.register('password')} />
            </div>
            <div className="space-y-1.5">
              <Label>Role</Label>
              <Select {...form.register('role')}>
                {ACTOR_ROLES.map((role) => (
                  <option key={role} value={role}>
                    {formatLabel(role)}
                  </option>
                ))}
              </Select>
            </div>
            <div className="flex items-end">
              <Button type="submit" disabled={createMutation.isPending} className="w-full">
                {createMutation.isPending ? 'Creating…' : 'Create user'}
              </Button>
            </div>
          </form>
        </section>
      ) : null}

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
              {(usersQuery.data ?? []).map((item) => (
                <tr key={item.id} className="border-t border-border">
                  <td className="px-4 py-3">
                    {editingId === item.id ? (
                      <Input value={editName} onChange={(e) => setEditName(e.target.value)} />
                    ) : (
                      item.name
                    )}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs">{item.email}</td>
                  <td className="px-4 py-3">
                    {editingId === item.id && hasPermission('user:create') ? (
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
                            onClick={() =>
                              updateMutation.mutate({
                                id: item.id,
                                name: editName,
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
                            <Button
                              size="sm"
                              variant="danger"
                              onClick={() => deleteMutation.mutate(item.id)}
                            >
                              Delete
                            </Button>
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
    </div>
  )
}
