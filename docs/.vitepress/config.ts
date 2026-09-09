import { defineConfig } from 'vitepress'

export default defineConfig({
  title: "Dashboard Template",
  description: "Standardized enterprise frontend dashboard architecture built with React, Vite, shadcn/ui, TanStack Router, and TanStack Query.",
  themeConfig: {
    nav: [
      { text: 'Home', link: '/' },
      { text: 'Guide', link: '/guide/introduction' },
      { text: 'Architecture', link: '/architecture/routing' },
    ],

    sidebar: {
      '/guide/': [
        {
          text: 'Getting Started',
          items: [
            { text: 'Introduction', link: '/guide/introduction' },
            { text: 'Quick Start', link: '/guide/quick-start' },
            { text: 'Project Structure', link: '/guide/project-structure' },
          ]
        }
      ],
      '/architecture/': [
        {
          text: 'Architecture & Core',
          items: [
            { text: 'Routing & Layouts', link: '/architecture/routing' },
            { text: 'Styling & Tailwind v4', link: '/architecture/styling' },
            { text: 'State & Data Fetching', link: '/architecture/state-management' },
            { text: 'Internationalization (i18n)', link: '/architecture/i18n' },
          ]
        }
      ]
    },

    socialLinks: [
      { icon: 'github', link: 'https://github.com/your-company/dashboard-template' }
    ]
  }
})