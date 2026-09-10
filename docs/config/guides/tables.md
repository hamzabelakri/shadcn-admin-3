# Data tables: URL-synced state

> **Status:** draft. Covers `hooks/use-table-url-state.ts`. Pairs with [Data fetching](../architecture/data-fetching.md) for how the underlying queries work.

Every data table in this template (users, roles, audits) keeps its pagination, global search, and column filters **in the URL's search params** rather than purely in component state — via `useTableUrlState`. This means a filtered, paginated table view is a shareable/bookmarkable link, and the browser back button behaves correctly.

## Why this exists

TanStack Table wants `pagination`, `columnFilters`, and `globalFilter` as controlled state with `onChange` handlers. `useTableUrlState` implements those handlers so that instead of `setState`, they call the router's `navigate({ search: ... })` — reading the *current* state back out of the URL rather than a local `useState`.

## Basic usage

```ts
const { pagination, onPaginationChange, globalFilter, onGlobalFilterChange, columnFilters, onColumnFiltersChange, ensurePageInRange } =
  useTableUrlState({
    search: Route.useSearch(),
    navigate: Route.useNavigate(),
    pagination: { pageKey: 'page', pageSizeKey: 'pageSize', defaultPage: 1, defaultPageSize: 10 },
    globalFilter: { enabled: true, key: 'filter' },
    columnFilters: [
      { columnId: 'status', searchKey: 'status', type: 'array' },
      { columnId: 'name', searchKey: 'name', type: 'string' },
    ],
  })
```

Pass the resulting `pagination`, `onPaginationChange`, etc. straight into `useReactTable(...)`'s options.

## Behavior worth knowing before you customize it

- **Values matching the default are omitted from the URL**, not written as `?page=1`. E.g. going back to page 1 removes `page` from the search params entirely, rather than leaving `page=1` in the URL. This keeps URLs clean but means "is a filter active" checks should compare against `undefined`, not against the default value.
- **Changing the global filter or a column filter resets `page` to `undefined`** (i.e. back to page 1) automatically — you don't need to reset pagination yourself when filters change.
- **`ensurePageInRange(pageCount, { resetTo })`** — call this after your query resolves with a known page count, to catch the case where the user is on page 5 of a filtered view that now only has 2 pages (e.g. after narrowing a filter). It navigates with `replace: true` so it doesn't add a junk history entry.
- Column filters support two types: `'string'` (simple text match) and `'array'` (multi-select, e.g. status checkboxes). Each can define custom `serialize`/`deserialize` if the URL representation needs to differ from the in-memory value (e.g. encoding an array as a comma-separated string).

## Requires a route with a search schema

Since `search` and `navigate` come from the route (`Route.useSearch()` / `Route.useNavigate()`), any route using this hook needs a `validateSearch` (Zod schema, matching the pattern seen in `routes/(auth)/sign-in.tsx`) that includes the relevant keys — otherwise TanStack Router won't type or validate those search params. This isn't shown in the hook itself; it needs to be set up per-route.

## Open questions

- Has this been confirmed working with `zod` `validateSearch` schemas on the actual `users`/`roles`/`audits` routes, or does the route currently just pass `search` through untyped? (We've only seen the route *files*, not their full contents with `validateSearch` — worth checking when we look at `apps/users`.)
