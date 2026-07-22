import { EmployeeActionGrid } from '@/features/employees/EmployeeActionGrid'
import { EmployeeProfileForm } from '@/features/employees/EmployeeProfileForm'

export default function EmployeePage() {
  return (
    <div className="mx-auto flex max-w-[1400px] flex-col gap-6">
      <section className="space-y-2">
        <h2 className="text-2xl font-semibold tracking-tight md:text-3xl">
          Employee Actions
        </h2>
        <p className="max-w-3xl text-sm text-muted-foreground md:text-base">
          Perform day-to-day security operations as an employee. Every action is
          validated and audited on the server, then appears instantly in the
          dashboard.
        </p>
      </section>

      <EmployeeProfileForm />
      <EmployeeActionGrid />
    </div>
  )
}
