import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { z } from 'zod'

import { ApiRequestError } from '@/api/httpClient'
import { registerRequest } from '@/api/authApi'
import { AuthShell } from '@/components/auth/AuthShell'
import { PasswordRequirements } from '@/components/auth/PasswordRequirements'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { useDetectedRegion } from '@/hooks/useDetectedRegion'
import { strongPasswordSchema } from '@/lib/passwordPolicy'
import { useAuthStore } from '@/stores/authStore'

const registerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: strongPasswordSchema,
})

type RegisterForm = z.infer<typeof registerSchema>

export default function RegisterPage() {
  const navigate = useNavigate()
  const { token, setSession } = useAuthStore()
  const regionQuery = useDetectedRegion()

  const form = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
    },
    mode: 'onBlur',
  })

  const passwordValue = form.watch('password')

  const mutation = useMutation({
    mutationFn: registerRequest,
    onSuccess: (data) => {
      setSession(data.token, data.user)
      toast.success('Account created')
      navigate('/employees', { replace: true })
    },
    onError: (error: unknown) => {
      toast.error(error instanceof ApiRequestError ? error.message : 'Registration failed')
    },
  })

  if (token) {
    return <Navigate to="/employees" replace />
  }

  return (
    <AuthShell
      title="Create account"
      subtitle="Self-register as a standard employee. Region is detected automatically from your network."
    >
      <form
        className="space-y-4"
        onSubmit={form.handleSubmit((values) => mutation.mutate(values))}
      >
        <div className="space-y-1.5">
          <Label htmlFor="name">Full name</Label>
          <Input id="name" autoComplete="name" {...form.register('name')} />
          {form.formState.errors.name ? (
            <p className="text-xs text-danger">{form.formState.errors.name.message}</p>
          ) : null}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="email">Work email</Label>
          <Input id="email" type="email" autoComplete="email" {...form.register('email')} />
          {form.formState.errors.email ? (
            <p className="text-xs text-danger">{form.formState.errors.email.message}</p>
          ) : null}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            autoComplete="new-password"
            {...form.register('password')}
          />
          {form.formState.errors.password ? (
            <p className="text-xs text-danger">{form.formState.errors.password.message}</p>
          ) : (
            <p className="text-xs text-muted-foreground">
              Use a strong password — requirements update as you type.
            </p>
          )}
          <PasswordRequirements value={passwordValue} className="mt-2" />
        </div>
        <div className="space-y-1.5">
          <Label>Detected region</Label>
          {regionQuery.isLoading ? (
            <Skeleton className="h-10 w-full" />
          ) : (
            <div className="flex h-10 items-center justify-between rounded-md border border-border bg-muted/40 px-3 text-sm">
              <span className="font-mono">{regionQuery.data?.region ?? 'detecting…'}</span>
              <Badge variant="muted">{regionQuery.data?.source ?? 'default'}</Badge>
            </div>
          )}
          <p className="text-xs text-muted-foreground">
            Region is detected automatically. Your IP is recorded only in audit logs.
          </p>
        </div>
        <Button type="submit" className="w-full" disabled={mutation.isPending}>
          {mutation.isPending ? 'Creating…' : 'Create account'}
        </Button>
      </form>
      <p className="mt-4 text-sm text-muted-foreground">
        Already have an account?{' '}
        <Link to="/login" className="font-medium text-teal-700 hover:underline">
          Sign in
        </Link>
      </p>
    </AuthShell>
  )
}
