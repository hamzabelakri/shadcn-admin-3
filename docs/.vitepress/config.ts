import { defineConfig } from 'vitepress'

// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: "Dashboard Template",
  description: "Internal documentation for the React + Vite dashboard template",
  themeConfig: {
    // https://vitepress.dev/reference/default-theme-config
    nav: [
      { text: 'Home', link: '/' },
      { text: 'Architecture', link: '/architecture/overview' },
      { text: 'Guides', link: '/guides/tables' },
      { text: 'Examples', link: '/markdown-examples' }
    ],

    sidebar: [
      {
        text: 'Architecture',
        collapsed: false,
        items: [
          { text: 'Overview', link: '/architecture/overview' },
          { text: 'Routing', link: '/architecture/routing' },
          { text: 'Context providers', link: '/architecture/context-providers' },
          { text: 'Theming, fonts & direction', link: '/architecture/theming' },
          { text: 'Data fetching', link: '/architecture/data-fetching' },
          { text: 'Permissions (RBAC)', link: '/architecture/permissions' },
          { text: 'API client', link: '/mutation/api-client' },
          { text: 'Internationalization', link: '/architecture/i18n' }
        ]
      },
      {
        text: 'Guides',
        collapsed: false,
        items: [
          { text: 'Data tables', link: '/guides/tables' }
        ]
      },
      {
        text: 'Examples',
        collapsed: true,
        items: [
          { text: 'Markdown Examples', link: '/markdown-examples' },
          { text: 'Runtime API Examples', link: '/api-examples' }
        ]
      }
    ],

    socialLinks: [
      { icon: 'github', link: 'https://github.com/vuejs/vitepress' }
    ]
  }
})