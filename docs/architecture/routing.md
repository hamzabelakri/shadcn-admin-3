# Routing

> **Status:** draft. See [Architecture overview](./overview.md) for how this fits into app bootstrap.

Routes live in `src/routes/` and use TanStack Router's **file-based routing**, where the file/folder name encodes routing behavior. The generated route tree (`routeTree.gen.ts`) is what actually gets consumed by `createRouter` in `main.tsx` — don't hand-edit that generated file.

## Naming conventions used in this project

| Pattern | Meaning | Example |
|---|---|---|
| `__root.tsx` | The app shell. Not a URL segment. | `routes/__root.tsx` |
| `_name/` (leading underscore) | **Pathless layout route** — adds a wrapping component and/or a `beforeLoad` guard to everything nested inside it, without adding a URL segment | `routes/_authenticated/` |
| `(name)/` (parentheses) | **Route group** — organizes files without affecting the URL and without adding a layout | `routes/(auth)/` |
| `index.tsx` | The route for the folder's own path | `routes/_authenticated/index.tsx` → `/` |
| `route.tsx` | Defines the layout/guard for a pathless or grouped route | `routes/_authenticated/route.tsx` |
| `$param.tsx` | Dynamic URL segment, read via `Route.useParams()` | `routes/_authenticated/errors/$error.tsx` |

## Root route (`__root.tsx`)

Defines app-wide chrome and fallback behavior, rendered around every route via `<Outlet />`:

- `NavigationProgress` — top-of-page loading bar
- `Toaster` — global toast host (5s duration)
- `notFoundComponent` / `errorComponent` — catch-all 404 and error boundary for **any** route in the tree
- Dev-only: React Query and Router devtools

It's typed with `createRootRouteWithContext<{ queryClient: QueryClient }>()`, which is what makes `queryClient` available inside every route's `loader`/`beforeLoad` via the router context (not React context — this runs outside the component tree).

## The `_authenticated` guard

`routes/_authenticated/route.tsx` is a pathless layout route with a `beforeLoad` hook that runs before any child route loads:

1. Reads `localStorage['auth-storage']`
2. Parses it and checks `parsed.state.token`
3. If either is missing, `redirect({ to: '/sign-in' })`

The `{ state: { token } } }` shape strongly suggests a Zustand `persist`-backed auth store — **not yet confirmed**, pending the `lib/` or `stores/` batch.

Because the guard lives on the layout route (not on each child), **every route nested under `_authenticated/` inherits the guard automatically**:

```
_authenticated/
├── route.tsx        ← beforeLoad guard + AuthenticatedLayout wrapper
├── index.tsx         → /                (Dashboard)
├── users/index.tsx   → /users           (Users)
├── roles/index.tsx   → /roles           (Roles)
├── audits/index.tsx  → /audits          (Audits)
└── errors/$error.tsx → /errors/:error   (dynamic error pages)
```

**How to add a new protected page:** create a new file under `_authenticated/`. No auth logic needed in the new file — the layout route's guard already applies.

## The `(auth)` group

`routes/(auth)/sign-in.tsx` sits outside the authenticated layout entirely — no guard, no `AuthenticatedLayout` wrapper. It validates its own search params with a Zod schema (`?redirect=`) via `validateSearch`, which is presumably where the guard sends users back to after a successful login.

## Feature route → page component convention

Route files here are intentionally thin. They import their page component from `@/apps/<feature>`, e.g.:

```tsx
// routes/_authenticated/users/index.tsx
import { Users } from '@/apps/users'

export const Route = createFileRoute('/_authenticated/users/')({
  component: Users,
})
```

**Note for the team:** page components live under `@/apps/`, not `@/pages/`. This is a deliberate convention in this template — worth remembering so you don't go looking for (or accidentally create) a `pages/` directory.

## Error handling has two layers

1. **Routing-level failures** (bad URL, thrown render error, anywhere in the tree) → caught by `__root.tsx`'s `notFoundComponent` / `errorComponent`.
2. **Application-triggered error states** (e.g. an API call returns 403) → the app navigates to `/errors/:error` with a specific code. `errors/$error.tsx` maps that code to a component:

   | Param value | Component |
   |---|---|
   | `unauthorized` | `UnauthorisedError` |
   | `forbidden` | `ForbiddenError` |
   | `not-found` | `NotFoundError` |
   | `internal-server-error` | `GeneralError` |
   | `maintenance-error` | `MaintenanceError` |

   Unrecognized codes fall back to `NotFoundError`.

## Open questions (to confirm in a future batch)

- ~~Where does the auth store live?~~ Confirmed: `@/stores/auth-store`, a hook `useAuthStore` with `user`, `token`, `refreshToken`, `setAuth(data)`, `clearAuth()`, `updateTokens(access, refresh)`. Store's internal shape (persist config, exact localStorage key structure) not yet fully confirmed — pending the `stores/` batch itself.
- ~~What does `validateSearch`'s `redirect` param get used for?~~ Confirmed: **not** used by `useLogin` (which always navigates to `/`) — it's used by `lib/axios.ts`'s `handleSessionExpired()`, triggered on a failed token refresh. It captures the current path and passes it as `?redirect=` when sending the user to `/sign-in`, so a session-expiry mid-session preserves where they were. Whether `sign-in`'s own success handler reads that `redirect` param to navigate back afterward is still unconfirmed — `useLogin` as currently written navigates to `/` unconditionally, which would mean the `redirect` param is captured but never consumed. Worth a direct question to the team rather than assuming either way.
