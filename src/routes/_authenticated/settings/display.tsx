import { createFileRoute } from '@tanstack/react-router'
import { SettingsDisplay } from '@/apps/settings/display'

export const Route = createFileRoute('/_authenticated/settings/display')({
  component: SettingsDisplay,
})
