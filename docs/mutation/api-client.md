# API client

> **Status:** draft. Covers `lib/axios.ts`, `lib/query-client.ts`, `lib/cookies.ts`, `lib/utils.ts`. See [Data fetching](./data-fetching.md) for how hooks consume this layer.

## `queryClient` configuration (`lib/query-client.ts`)

The default retry/refetch behavior is intentionally non-default — worth understanding before assuming standard TanStack Query defaults apply:

```ts
retry: (failureCount, error) => {
  if (import.meta.env.DEV && failureCount >= 1) return false   // fail fast in dev
  if (failureCount > 3) return false                            // cap at 3 retries
  if (error instanceof AxiosError && [401, 403, 404].includes(error.response?.status ?? 0)) return false
  return true
},
refetchOnWindowFocus: import.meta.env.PROD,  // only in production
staleTime: 10 * 1000,                         // 10 seconds
```

- **In dev, queries don't retry** past the first failure — makes broken endpoints obvious immediately instead of waiting through 3 retry delays while debugging.
- **401/403/404 never retry**, in any environment — these are "the request is fundamentally wrong," not "the network hiccuped," so retrying wastes time and (for 401) is handled separately by the refresh flow below, not by query retries.
- **`refetchOnWindowFocus` is off in dev** — avoids refetch spam while switching between browser and editor.
- Mutations never retry (`retry: false`), which makes sense — a create/update/delete that failed shouldn't silently fire twice.

## The shared axios instance (`lib/axios.ts`)

`axiosApi` is the single configured client every `service/*.ts` function is expected to call — no feature should construct its own axios instance.

### Base URL resolution

```ts
localhost           → http://localhost:8300/api   (local dev, backend on a separate port)
anything else        → {protocol}//{host}/api       (same-origin, e.g. behind a reverse proxy)
```

### Request interceptor

Every outgoing request automatically gets:
- `Authorization: Bearer <token>` — read via `useAuthStore.getState().token` (not a hook — interceptors run outside React, so this reads the store's current value directly rather than subscribing to it)
- `Accept-Language: <current i18n language>` — keeps the backend in sync with whatever language the UI is showing

### Response interceptor: automatic token refresh

On a `401` (and the failing request hasn't already been retried):

1. If a refresh is **already in flight**, the failing request is queued (`failedQueue`) rather than triggering a second concurrent refresh call — it resolves once the in-flight refresh completes.
2. Otherwise, it calls `/auth/refresh-token` with the stored `refreshToken`.
   - **Success** → `useAuthStore.getState().updateTokens(access, refresh)`, the original request is retried with the new token, and any queued requests are released with it.
   - **Failure** (or no `refreshToken` present) → `handleSessionExpired()`: clears auth, shows an alert, and on confirm navigates to `/sign-in?redirect=<current path>` — see [Routing → the `_authenticated` guard](./routing.md#the-_authenticated-guard) for how that path gets used again on next login attempt (unconfirmed whether it currently is).

Other status codes get a toast via `useAlertStore.getState().showAlert(...)` but no special handling:

| Status | Behavior |
|---|---|
| `403` | Toast: "Access Forbidden! You do not have permission to perform this action." |
| `500` | Toast: "Server Error! Please try again later." |
| No response (network error) | Toast: "Network Error! Please check your internet connection." |

**Note on calling `router` outside React:** `axios.ts` imports `router` directly from `@/main` (the exported `createRouter()` instance) rather than `useRouter()`, since interceptors aren't React components and can't call hooks. Follow this pattern — importing the singleton, not the hook — for any other non-component code that needs to navigate or read store state (as this file does with `useAuthStore.getState()` / `useAlertStore.getState()`).

## Cookies (`lib/cookies.ts`)

Plain `document.cookie` wrapper (`getCookie` / `setCookie` / `removeCookie`), replacing a `js-cookie` dependency. This is what every context provider ([theme, font, direction, layout](./context-providers.md)) uses for persistence — not localStorage. All guard for `typeof document === 'undefined'`, so they're safe to import in non-browser contexts even though this app doesn't appear to run server-side.

## Misc utilities (`lib/utils.ts`)

- **`cn(...)`** — the standard shadcn/ui `clsx` + `tailwind-merge` combinator. Use this instead of template-string class concatenation anywhere classes are conditionally applied.
- **`sleep(ms)`** — promise-based delay, presumably for tests or deliberate UX pacing.
- **`createDownloadLink(blob, filename)`** — creates an object URL, injects and clicks a hidden `<a download>`, then removes it. This is almost certainly what the export mutations (`useExportUsers`, `useExportAudits` — see [Data fetching](./data-fetching.md#export-mutations)) call once `service/` returns a file blob, though we haven't seen that exact call site yet.

## Open questions

- Does `sign-in`'s success flow actually read and use `search.redirect`, or does `handleSessionExpired` populate a param nothing currently consumes?
- Confirm `stores/auth-store.ts`'s exact shape (`token`, `refreshToken`, `updateTokens`, persistence key/structure) — referenced here and in routing/permissions docs but not yet seen directly.
