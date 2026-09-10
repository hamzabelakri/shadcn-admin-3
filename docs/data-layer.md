### 2. `docs/data-layer.md`

```markdown
---
outline: deep
---

# Data Layer & State Management

## Architecture
The template enforces a strict separation of concerns between data fetching, mutation logic, and local UI state:
1. **Services (`src/service/`)** handle raw endpoint requests using the central `axiosApi`.
2. **TanStack Query Hooks (`src/hooks/`)** manage caching, background refetching, query invalidation, and automated error/success alert notifications.
3. **Zustand Stores (`src/stores/`)** manage localized UI concerns, such as active filter parameters, pagination states, and modal dialog toggles.

## Concept
* **Encapsulated Queries & Mutations:** Components never call `axiosApi` directly. Instead, they consume tailored custom hooks (`useUsers`, `useCreateUser`, etc.) that bundle error boundaries and cache management.
* **Automatic Cache Invalidation:** Successful mutations automatically trigger query invalidations (`queryClient.invalidateQueries`), ensuring UI data stays synchronized with the backend without manual page reloads.

## Standard
* **Never** perform direct HTTP requests inside React components.
* **Always** create a dedicated feature service and custom TanStack Query hook wrapper for new data entities.
* **Always** bundle global feedback (success/error alerts) directly inside the mutation hook lifecycle (`onSuccess` / `onError`) rather than repeating alert logic across views.

## How to Use It

### 1. Fetching Data with Queries
Use the custom query hook inside your components to fetch and cache lists or single entities:

```tsx
import { useUsers } from '@/hooks/use-users'

export function UserListTable() {
  const { data, isLoading, error } = useUsers({ page: 1, pageSize: 10 })

  if (isLoading) return <div>Loading...</div>
  if (error) return <div>Error loading users</div>

  return (
    <ul>
      {data?.data.map((user) => (
        <li key={user.user_id}>{user.first_name} {user.last_name}</li>
      ))}
    </ul>
  )
}
