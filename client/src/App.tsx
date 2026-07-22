import { AppRouter } from '@/routes/AppRouter'
import { AppProviders } from '@/providers/AppProviders'

export default function App() {
  return (
    <AppProviders>
      <AppRouter />
    </AppProviders>
  )
}
