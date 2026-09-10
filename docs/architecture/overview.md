# Architecture overview

> **Status:** draft — being written incrementally as we document the codebase.
> Covered so far: app bootstrap, routing, context providers, styling/theming.
> Not yet covered: `apps/` feature folders, `components/`, `lib/` utilities, auth store, data-fetching conventions.

This template is a React + Vite dashboard built on:

| Concern | Library |
|---|---|
| Routing | [TanStack Router](https://tanstack.com/router) (file-based) |
| Server state | [TanStack Query](https://tanstack.com/query) |
| UI primitives | [shadcn/ui](https://ui.shadcn.com) (Radix + Tailwind) |
| Styling | Tailwind CSS v4 (CSS-first config, no `tailwind.config.js`) |
| Type safety | TypeScript |

## App bootstrap (`src/main.tsx`)

Before the route tree renders, the app is wrapped in a fixed stack of providers. The nesting order matters — each layer depends on something above it being available (React Query's client, in particular, is threaded into two places at once — see below).

```
QueryClientProvider          → provides queryClient to the whole React tree
 └─ ThemeProvider            → light / dark / system theme
     └─ FontProvider         → active font family
         └─ DirectionProvider → ltr / rtl
             └─ AlertProvider → global confirm-dialog host
                 └─ RouterProvider → mounts the generated route tree
```

**Why `queryClient` is created once and passed twice:** the same `queryClient` instance passed to `QueryClientProvider` is also passed into `createRouter({ context: { queryClient } })`. This means route `loader` functions can call `queryClient.ensureQueryData(...)` to prefetch data *before* a route's component renders, without needing to reach for React context inside a loader (loaders run outside the React tree). See [Routing](./routing.md) for how this is typed via `createRootRouteWithContext`.

**Dev-only tooling:** `ReactQueryDevtools` and `TanStackRouterDevtools` are mounted in `__root.tsx`, gated behind `import.meta.env.MODE === 'development'` — they won't ship in production builds.

## Related pages

- [Routing](./routing.md) — file-based route conventions, the `_authenticated` guard, error routes
- [Context providers](./context-providers.md) — what each provider in `src/context/` controls, and which ones are *not* app-wide
- [Theming](./theming.md) — how color, font, and direction providers connect to the Tailwind v4 CSS variables in `theme.css`
