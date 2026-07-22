import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { z } from 'zod'

import { ApiRequestError } from '@/api/httpClient'
import { registerRequest } from '@/api/authApi'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { AuthShell } from '@/components/auth/AuthShell'
import { useAuthStore } from '@/stores/authStore'

const registerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
  region: z.string().min(2),
})

type RegisterForm = z.infer<typeof registerSchema>

export default function RegisterPage() {
  const navigate = useNavigate()
  const { token, setSession } = useAuthStore()

  const form = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      region: 'ap-south-1',
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
      subtitle="Self-register as a standard employee. Admins can elevate roles later."
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
          <Label htmlFor="region">Region</Label>
          <Select id="region" {...form.register('region')}>
            <option value="ap-south-1">ap-south-1</option>
            <option value="us-east-1">us-east-1</option>
            <option value="eu-west-1">eu-west-1</option>
          </Select>
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
