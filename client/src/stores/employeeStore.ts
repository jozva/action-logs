import { create } from 'zustand'
import { persist } from 'zustand/middleware'

import type { ActorRole } from '@/constants/logs'

interface EmployeeState {
  actor: string
  role: ActorRole
  region: string
  setActor: (actor: string) => void
  setRole: (role: ActorRole) => void
  setRegion: (region: string) => void
}

export const useEmployeeStore = create<EmployeeState>()(
  persist(
    (set) => ({
      actor: 'priya.nair@company.com',
      role: 'admin',
      region: 'ap-south-1',
      setActor: (actor) => set({ actor }),
      setRole: (role) => set({ role }),
      setRegion: (region) => set({ region }),
    }),
    { name: 'gidy-employee-profile' },
  ),
)
