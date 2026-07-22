import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { z } from 'zod'

import { ApiRequestError } from '@/api/httpClient'
import { loginRequest } from '@/api/authApi'
import { AuthShell } from '@/components/auth/AuthShell'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuthStore } from '@/stores/authStore'

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1, 'Password is required'),
})

type LoginForm = z.infer<typeof loginSchema>

export default function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { token, setSession } = useAuthStore()
  const from = (location.state as { from?: string } | null)?.from || '/employees'

  const form = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: 'admin@company.com',
      password: 'Admin123!',
    },
  })

  const mutation = useMutation({
    mutationFn: loginRequest,
    onSuccess: (data) => {
      setSession(data.token, data.user)
      toast.success(`Welcome back, ${data.user.name}`)
      navigate(from, { replace: true })
    },
    onError: (error: unknown) => {
      toast.error(error instanceof ApiRequestError ? error.message : 'Login failed')
    },
  })

  if (token) {
    return <Navigate to="/employees" replace />
  }

  return (
    <AuthShell
      title="Sign in"
      subtitle="Access the employee workspace with your company account."
    >
      <form
        className="space-y-4"
        onSubmit={form.handleSubmit((values) => mutation.mutate(values))}
      >
        <div className="space-y-1.5">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" {...form.register('email')} />
          {form.formState.errors.email ? (
            <p className="text-xs text-danger">{form.formState.errors.email.message}</p>
          ) : null}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="password">Password</Label>
          <Input id="password" type="password" {...form.register('password')} />
          {form.formState.errors.password ? (
            <p className="text-xs text-danger">{form.formState.errors.password.message}</p>
          ) : null}
        </div>
        <Button type="submit" className="w-full" disabled={mutation.isPending}>
          {mutation.isPending ? 'Signing in…' : 'Sign in'}
        </Button>
      </form>
      <p className="mt-4 text-sm text-muted-foreground">
        No account?{' '}
        <Link to="/register" className="font-medium text-teal-700 hover:underline">
          Create account
        </Link>
      </p>
      <p className="mt-2 text-xs text-muted-foreground">
        Demo admin: admin@company.com / Admin123!
      </p>
    </AuthShell>
  )
}
