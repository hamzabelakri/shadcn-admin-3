import { createFileRoute } from '@tanstack/react-router'
import { SettingsProfile } from '@/apps/settings/profile'

export const Route = createFileRoute('/_authenticated/settings/')({
  component: SettingsProfile,
})
