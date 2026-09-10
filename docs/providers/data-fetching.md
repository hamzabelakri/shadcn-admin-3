# Data fetching

> **Status:** draft. See [Architecture overview](./overview.md) for how `queryClient` is bootstrapped.

Every feature (`users`, `roles`, `audits`, and presumably future ones) follows the same TanStack Query hook shape, split across three layers:

```
hooks/use-<feature>.ts   → useQuery / useMutation wrappers (what components call)
service/<feature>.ts     → the actual API calls (axios) — not yet documented in detail
models/<feature>-model.ts → TypeScript types for the feature's data
```

Components never call `service/` or construct query keys directly — they call the hook.

## List queries

```ts
export function useUsers(params?: UserQueryParams) {
  return useQuery<UserResponse, Error>({
    queryKey: ['users', params],
    queryFn: () => getUsers(params),
    retry: 1,
    onError: (error) => console.error('Error fetching users:', error),
  })
}
```

- Query key is `[<plural-feature-name>, params]` — including `params` in the key means a query with different filters/pagination is cached separately, which is what makes the [table URL state](../guides/tables.md) pattern work correctly with TanStack Query's cache.
- `retry: 1` is the project-wide default for list queries.
- **List queries do not show a toast on error** — only `console.error`. If you want user-visible error handling on a list view, you currently need to handle `isError` in the component yourself; the hook won't do it for you. Confirm with your team whether this is intentional before assuming it's the pattern to keep following.

## Single-item queries

```ts
export function useUser(id: ID) {
  const { showAlert } = useAlertStore()
  return useQuery<User, AxiosError>({
    queryKey: ['user', id],
    queryFn: () => getUserById(id!),
    enabled: !!id,
    retry: 1,
    onError: (error) => showAlert({ message: error?.response?.data?.error, type: AlertEnum.ERROR }),
  })
}
```

- Query key is `[<singular-feature-name>, id]`.
- `enabled: !!id` — guards against firing the request before `id` is available (e.g. route param not yet resolved). Always add this when a query depends on a value that might briefly be `undefined`.
- Unlike list queries, single-item queries **do** show a toast via `useAlertStore().showAlert()` on error.

## Mutations (create / update / delete)

```ts
export function useCreateUser() {
  const queryClient = useQueryClient()
  const { showAlert } = useAlertStore()

  return useMutation<UserResponse, Error, Partial<User>>({
    mutationFn: createUser,
    onSuccess: (data) => {
      showAlert({ message: data?.message, type: AlertEnum.SUCCESS })
      queryClient.invalidateQueries({ queryKey: ['users'] })
    },
    onError: (error: any) => {
      showAlert({ message: error?.response?.data?.error, type: AlertEnum.ERROR })
    },
  })
}
```

Every mutation follows this shape:

1. `onSuccess` → `showAlert(..., SUCCESS)` + `invalidateQueries` to mark affected cache entries stale
2. `onError` → `showAlert(..., ERROR)`, reading the message from `error.response.data.error` (an axios error shape)

**Which query keys to invalidate is not perfectly consistent across features** — worth standardizing rather than copying whichever example is closest:

| Hook | Invalidates |
|---|---|
| `useCreateUser` / `useCreateRole` | list only (`['users']` / `['roles']`) |
| `useUpdateRole` | both list and detail (`['roles']` and `['role', id]`) |
| `useUpdateUser` | both list and detail (`['users']` and `['user', id]`) |
| `useDeleteRole` / `useDeleteUser` | list only |

**Recommendation for new features:** on create, invalidate the list. On update, invalidate both the list and the specific detail key. On delete, invalidate the list (the detail query for a deleted item has nowhere useful to refetch to).

## Export mutations

A separate mutation shape for file exports (seen in `useExportUsers`, `useExportAudits`): takes `{ fileType, params }`, calls a `service/` export function, and shows a success/error toast — no `invalidateQueries`, since exporting doesn't change server state.

## Login / logout are mutations too

`hooks/use-auth.ts` follows the mutation pattern above but couples into the router and the auth store instead of the query cache:

```ts
export function useLogin() {
  const router = useRouter()
  const setAuth = useAuthStore((state) => state.setAuth)
  const { showAlert } = useAlertStore()

  return useMutation({
    mutationFn: login,
    onSuccess: (data) => {
      setAuth(data)
      router.navigate({ to: '/' })
    },
    onError: (error) => showAlert({ message: error?.response?.data?.error, type: AlertEnum.ERROR }),
  })
}
```

This is the piece that (almost certainly) writes the `auth-storage` value the [`_authenticated` route guard](./routing.md#the-_authenticated-guard) reads back on every navigation. `useLogout` mirrors it: clears the auth store and navigates to `/sign-in`.

## Open questions

- `service/<feature>.ts` almost certainly wraps calls to the shared `axiosApi` instance documented in [API client](./api-client.md) (which handles base URL, auth header, and token refresh) — not yet confirmed by seeing an actual `service/*.ts` file directly.
- Confirm the list-query silent-error behavior is intentional.
- Standardize (and document as a lint rule or code review checklist item, maybe) which query keys a mutation should invalidate.
