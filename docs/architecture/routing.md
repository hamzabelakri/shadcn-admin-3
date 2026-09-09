# Routing & Layout System

This template uses **TanStack Router** for file-based routing with full type safety. Route trees are statically generated into `src/routeTree.gen.ts`.

## Layout Architecture

The application uses structural nesting via layout route wrappers:

1. **Root Route (`src/routes/__root.tsx`)**: Configures global providers, TanStack Query clients, React Query & Router devtools, and global toast notifications (`sonner`).
2. **Authenticated Layout (`src/routes/_authenticated/route.tsx`)**: Enforces authentication barriers via client-side storage evaluation before resolving downstream pages.

```typescript
export const Route = createFileRoute('/_authenticated')({
  beforeLoad: () => {
    const auth = localStorage.getItem('auth-storage')
    if (!auth) throw redirect({ to: '/sign-in' })
    const parsed = JSON.parse(auth)
    if (!parsed?.state?.token) throw redirect({ to: '/sign-in' })
  },
  component: AuthenticatedLayout,
})