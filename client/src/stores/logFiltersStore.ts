import { create } from 'zustand'

import {
  DEFAULT_PAGE,
  DEFAULT_PAGE_SIZE,
  type ActionType,
  type ActorRole,
  type LogSortField,
  type LogStatus,
  type ResourceType,
  type Severity,
  type SortOrder,
} from '@/constants/logs'
import type { LogFilters } from '@/types/logs'

interface LogFiltersState extends LogFilters {
  setSearch: (search: string) => void
  setFilter: <K extends keyof LogFilters>(key: K, value: LogFilters[K]) => void
  setSort: (sortBy: LogSortField, sortOrder?: SortOrder) => void
  setPage: (page: number) => void
  setPageSize: (pageSize: number) => void
  resetFilters: () => void
}

const initialFilters: LogFilters = {
  search: '',
  role: '',
  severity: '',
  status: '',
  action: '',
  resourceType: '',
  region: '',
  dateFrom: '',
  dateTo: '',
  page: DEFAULT_PAGE,
  pageSize: DEFAULT_PAGE_SIZE,
  sortBy: 'timestamp',
  sortOrder: 'desc',
}

export const useLogFiltersStore = create<LogFiltersState>((set) => ({
  ...initialFilters,
  setSearch: (search) => set({ search, page: DEFAULT_PAGE }),
  setFilter: (key, value) =>
    set((state) => ({
      ...state,
      [key]: value,
      page: key === 'page' ? (value as number) : DEFAULT_PAGE,
    })),
  setSort: (sortBy, sortOrder) =>
    set((state) => ({
      sortBy,
      sortOrder:
        sortOrder ??
        (state.sortBy === sortBy && state.sortOrder === 'asc' ? 'desc' : 'asc'),
      page: DEFAULT_PAGE,
    })),
  setPage: (page) => set({ page }),
  setPageSize: (pageSize) => set({ pageSize, page: DEFAULT_PAGE }),
  resetFilters: () => set({ ...initialFilters }),
}))

export type FilterSelectKey =
  | 'role'
  | 'severity'
  | 'status'
  | 'action'
  | 'resourceType'

export type FilterSelectValue =
  | ActorRole
  | Severity
  | LogStatus
  | ActionType
  | ResourceType
  | ''
