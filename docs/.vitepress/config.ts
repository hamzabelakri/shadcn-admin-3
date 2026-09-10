import { defineConfig } from 'vitepress'

export default defineConfig({
  title: "Frontend Template Docs",
  description: "Architecture and usage guide for the enterprise React dashboard template",
  themeConfig: {
    nav: [
      { text: 'Home', link: '/' },
      { text: 'Architecture', link: '/architecture/data-fetching' }
    ],

    sidebar: [
      {
        text: 'Core Architecture',
        items: [
          { text: 'Data Fetching & State', link: '/architecture/data-fetching' },
          { text: 'Routing & Protection', link: '/architecture/routing' },
          { text: 'Layout & Navigation', link: '/architecture/layout-navigation' }
        ]
      }
    ],

    socialLinks: [
      { icon: 'github', link: 'https://github.com/vuejs/vitepress' }
    ]
  }
})