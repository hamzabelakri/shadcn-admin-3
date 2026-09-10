# Context providers

> **Status:** draft. See [Architecture overview](./overview.md) for where these sit in the bootstrap order.

`src/context/` holds six providers. **Only four are mounted app-wide** in `main.tsx` — the other two appear to be scoped narrower. This is flagged explicitly below because it affects where a feature is available.

## App-wide providers (wired in `main.tsx`)

| Provider | File | Controls | Persistence | Hook |
|---|---|---|---|---|
| `ThemeProvider` | `theme-provider.tsx` | `light` / `dark` / `system`, resolved against `prefers-color-scheme` | Cookie `vite-ui-theme`, 1 year | `useTheme()` |
| `FontProvider` | `font-provider.tsx` | Active font, from the `fonts` array in `config/fonts.ts` | Cookie `font`, 1 year | `useFont()` |
| `DirectionProvider` | `direction-provider.tsx` | `ltr` / `rtl`, also wraps Radix's own `DirectionProvider` so RTL propagates into every Radix primitive | Cookie `dir`, 1 year | `useDirection()` |
| `AlertProvider` | `alert-provider.tsx` | Renders `<ConfirmAlert />` alongside `children` — a global confirmation-dialog host | — | *(none exported here — likely triggered via a separate store/hook not yet seen)* |

## Providers defined but **not** in the app-wide stack

| Provider | File | Controls | Persistence | Hook |
|---|---|---|---|---|
| `LayoutProvider` | `layout-provider.tsx` | Sidebar `collapsible` mode (`offcanvas` / `icon` / `none`) and `variant` (`inset` / `sidebar` / `floating`) | Cookies, **7 days** (shorter than the others) | `useLayout()` |
| `SearchProvider` | `search-provider.tsx` | Global command palette (`Cmd/Ctrl+K`), renders `<CommandMenu />` | — (in-memory only) | `useSearch()` |

**Why this matters:** since these two aren't in `main.tsx`, they're presumably mounted inside `AuthenticatedLayout` instead of at the app root. If that's confirmed, it means:
- The `Cmd/Ctrl+K` search palette and sidebar layout controls are **only available on authenticated pages** — not on `/sign-in`.
- A new top-level (unauthenticated) route that tries to call `useLayout()` or `useSearch()` will throw the provider's "must be used within" error.

*To confirm: this needs the `components/layout/authenticated-layout.tsx` file.*

## The shared pattern

All six providers follow the same recipe, which is worth documenting once as a template for adding a new global UI preference:

1. `createContext<T | null>(null)`
2. A `use<X>()` hook that throws if called outside the provider (`"useX must be used within a XProvider"`)
3. State initialized from a cookie (via `@/lib/cookies`) where persistence matters, falling back to a default
4. A `useEffect` that syncs the value onto the DOM — a class on `<html>` (theme, font) or an attribute (`dir`) — since these are visual/global concerns that Tailwind and Radix read from the DOM, not from React state directly
5. A `set<X>()` that updates both the cookie and React state, and a `reset<X>()` that clears the cookie and restores the default

**To add a new persisted UI preference**, copy this pattern rather than inventing a new one — it keeps cookie handling, defaults, and the DOM-sync effect consistent across the app.

## `AlertProvider` and the alert *store* — likely one system

Updated from the earlier "two separate things" guess: `lib/axios.ts`'s `handleSessionExpired()` calls `useAlertStore.getState().showAlert({ type, message, onConfirm: () => ... })` — `showAlert` accepts an **optional `onConfirm` callback**, not just a message and type. That strongly suggests:

- `useAlertStore` holds alert state generically (message, type, and an optional confirm callback)
- `AlertProvider`'s `<ConfirmAlert />` is the single component that reads that state and renders either a plain toast (no `onConfirm`) or a confirm-style dialog (with one)

Still pending final confirmation from `ConfirmAlert`'s own source, but this is the working model going forward rather than "two independent alert systems."

## Open questions (to confirm in a future batch)

- Confirm `LayoutProvider` / `SearchProvider` are mounted in `AuthenticatedLayout`, not `main.tsx`.
- Confirm `ConfirmAlert`'s source matches the "single component, toast vs. confirm mode" model above.
