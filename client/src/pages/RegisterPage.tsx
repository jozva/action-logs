import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { z } from 'zod'

import { ApiRequestError } from '@/api/httpClient'
import { registerRequest } from '@/api/authApi'
import { AuthShell } from '@/components/auth/AuthShell'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { useDetectedRegion } from '@/hooks/useDetectedRegion'
import { useAuthStore } from '@/stores/authStore'

const registerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
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
  })

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
          <Input id="name" {...form.register('name')} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="email">Work email</Label>
          <Input id="email" type="email" {...form.register('email')} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="password">Password</Label>
          <Input id="password" type="password" {...form.register('password')} />
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
            Auto-detected from IP / timezone. No manual selection required.
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
