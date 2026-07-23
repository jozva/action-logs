import { RotateCcw, Search } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import {
  ACTIONS,
  ACTOR_ROLES,
  LOG_STATUSES,
  REGIONS,
  RESOURCE_TYPES,
  SEVERITIES,
} from '@/constants/logs'
import { isDateRangeValid } from '@/lib/dateRange'
import { formatLabel } from '@/lib/logPresentation'
import { useLogFiltersStore } from '@/stores/logFiltersStore'

export function LogFiltersBar() {
  const {
    search,
    role,
    severity,
    status,
    action,
    resourceType,
    region,
    dateFrom,
    dateTo,
    setSearch,
    setFilter,
    setDateFilter,
    resetFilters,
  } = useLogFiltersStore()

  const rangeInvalid = !isDateRangeValid(dateFrom, dateTo)

  return (
    <section className="space-y-4 rounded-lg border border-border bg-card-solid/85 p-4 shadow-sm">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div className="w-full max-w-xl space-y-1.5">
          <Label htmlFor="search">Search</Label>
          <div className="relative">
            <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Actor, action, resource, IP, region, status"
              className="pl-9"
            />
          </div>
        </div>
        <Button variant="outline" onClick={resetFilters}>
          <RotateCcw className="h-4 w-4" />
          Reset
        </Button>
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <FilterSelect
          id="role"
          label="Role"
          value={role}
          options={ACTOR_ROLES}
          onChange={(value) => setFilter('role', value as typeof role)}
        />
        <FilterSelect
          id="severity"
          label="Severity"
          value={severity}
          options={SEVERITIES}
          onChange={(value) => setFilter('severity', value as typeof severity)}
        />
        <FilterSelect
          id="status"
          label="Status"
          value={status}
          options={LOG_STATUSES}
          onChange={(value) => setFilter('status', value as typeof status)}
        />
        <FilterSelect
          id="action"
          label="Action"
          value={action}
          options={ACTIONS}
          onChange={(value) => setFilter('action', value as typeof action)}
        />
        <FilterSelect
          id="resourceType"
          label="Resource Type"
          value={resourceType}
          options={RESOURCE_TYPES}
          onChange={(value) => setFilter('resourceType', value as typeof resourceType)}
        />
        <FilterSelect
          id="region"
          label="Region"
          value={region}
          options={REGIONS}
          onChange={(value) => setFilter('region', value as typeof region)}
        />
        <div className="space-y-1.5">
          <Label htmlFor="dateFrom">Date From</Label>
          <Input
            id="dateFrom"
            type="datetime-local"
            value={dateFrom}
            max={dateTo || undefined}
            onChange={(event) => setDateFilter('dateFrom', event.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="dateTo">Date To</Label>
          <Input
            id="dateTo"
            type="datetime-local"
            value={dateTo}
            min={dateFrom || undefined}
            onChange={(event) => setDateFilter('dateTo', event.target.value)}
          />
        </div>
      </div>

      {rangeInvalid ? (
        <p className="text-sm text-danger">
          Date From must be earlier than or equal to Date To.
        </p>
      ) : dateFrom || dateTo ? (
        <p className="text-xs text-muted-foreground">
          Date range is applied on the server. Clear either field or use Reset to
          remove the filter.
        </p>
      ) : null}
    </section>
  )
}

function FilterSelect({
  id,
  label,
  value,
  options,
  onChange,
}: {
  id: string
  label: string
  value: string
  options: readonly string[]
  onChange: (value: string) => void
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Select id={id} value={value} onChange={(event) => onChange(event.target.value)}>
        <option value="">All</option>
        {options.map((option) => (
          <option key={option} value={option}>
            {id === 'region' ? option : formatLabel(option)}
          </option>
        ))}
      </Select>
    </div>
  )
}
