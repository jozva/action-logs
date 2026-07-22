import { create } from 'zustand'
import { persist } from 'zustand/middleware'

import type { AuthUser, Permission } from '@/types/auth'

interface AuthState {
  token: string | null
  user: AuthUser | null
  setSession: (token: string, user: AuthUser) => void
  clearSession: () => void
  hasPermission: (permission: Permission) => boolean
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      token: null,
      user: null,
      setSession: (token, user) => set({ token, user }),
      clearSession: () => set({ token: null, user: null }),
      hasPermission: (permission) =>
        Boolean(get().user?.permissions.includes(permission)),
    }),
    { name: 'gidy-auth-session' },
  ),
)
