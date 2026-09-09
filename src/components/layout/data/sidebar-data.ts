import { ModuleEnum } from '@/models/module-model'
import { SidebarData } from '@/models/sidebar-model'
import {
  LayoutDashboard,
  Settings,
  Users,
  ShieldCheck,
  AudioWaveform,
  Command,
  GalleryVerticalEnd,
  ClipboardList,
} from 'lucide-react'

export const sidebarData: SidebarData = {
  user: {
    name: 'admin',
    email: 'admin@gmail.com',
    avatar: '/avatars/shadcn.jpg',
  },
  teams: [
    {
      name: 'University', 
      logo: Command,
    },
    {
      name: 'Acme Inc',
      logo: GalleryVerticalEnd,
      plan: 'Enterprise',
    },
    {
      name: 'Acme Corp.',
      logo: AudioWaveform,
      plan: 'Startup',
    },
  ],
  navGroups: [
    {
      title: 'general', 
      items: [
        {
          title: 'dashboard', 
          url: '/',
          icon: LayoutDashboard,
          module: ModuleEnum.Dashboard,
        },
      ],
    },
    {
      title: 'management', 
      items: [
        {
          title: 'role_management',
          url: '/roles',
          icon: ShieldCheck,
          module: ModuleEnum.Roles,
        },
        {
          title: 'user_management',
          url: '/users',
          icon: Users,
          module: ModuleEnum.Users,
        },
      ],
    },
    {
      title: 'reporting', 
      items: [
        {
          title: 'audits',
          url: '/audits',
          icon: ClipboardList,
          module: ModuleEnum.Audits,
        },
      ],
    },
    {
      title: 'settings', 
      items: [
        {
          title: 'settings', 
          icon: Settings,
          url: '/settings',
          module: ModuleEnum.Settings,
        },
      ],
    },
  ],
}