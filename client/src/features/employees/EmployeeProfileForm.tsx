import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { ACTOR_ROLES } from '@/constants/logs'
import { formatLabel } from '@/lib/logPresentation'
import { useEmployeeStore } from '@/stores/employeeStore'

const REGIONS = [
  'ap-south-1',
  'us-east-1',
  'us-west-2',
  'eu-west-1',
  'ap-southeast-1',
] as const

export function EmployeeProfileForm() {
  const { actor, role, region, setActor, setRole, setRegion } = useEmployeeStore()

  return (
    <section className="space-y-4 rounded-lg border border-border bg-card-solid/90 p-4 shadow-sm">
      <div>
        <h3 className="text-base font-semibold">Employee identity</h3>
        <p className="text-sm text-muted-foreground">
          Actions are executed as this employee and written to the audit log on the
          server.
        </p>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <div className="space-y-1.5 md:col-span-1">
          <Label htmlFor="employee-actor">Actor email</Label>
          <Input
            id="employee-actor"
            type="email"
            value={actor}
            onChange={(event) => setActor(event.target.value)}
            placeholder="priya.nair@company.com"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="employee-role">Role</Label>
          <Select
            id="employee-role"
            value={role}
            onChange={(event) => setRole(event.target.value as typeof role)}
          >
            {ACTOR_ROLES.map((option) => (
              <option key={option} value={option}>
                {formatLabel(option)}
              </option>
            ))}
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="employee-region">Region</Label>
          <Select
            id="employee-region"
            value={region}
            onChange={(event) => setRegion(event.target.value)}
          >
            {REGIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </Select>
        </div>
      </div>
    </section>
  )
}
