# Data Fetching & State Layer Architecture

This guide defines the standardized data flow, network interceptors, state management boundaries, and custom hook patterns required when integrating API endpoints into feature modules.

---

## 1. Architecture Flow

The template enforces a strict, layered architecture to isolate network logic, state management, and view components:

```

[ UI Components / Views ]
│
├───────────────────────────────┐
▼                               ▼
[ Custom Query/Mutation Hooks ]   [ Zustand Stores ]
(TanStack Query Cache)          (UI State: Modals, Filters, Auth)
│
▼
[ Service Layer ] ────────────> (Pure API Contracts & Payload Mapping)
│
▼
[ Central Axios Instance ] ──────> (Interceptors: Bearer Auth, Refresh Token, i18n, Global Errors)

```

---

## 2. Standardized API Response Shape

Every endpoint the template talks to — regardless of the backend framework serving it (Go, Node, Laravel, or anything else) — returns the exact same response envelope. This is a hard backend contract, not a convention: the service layer, hooks, and components are all written assuming this shape, with no per-endpoint unwrapping or mapping.

```json
{
  "status": 200,
  "message": "Success",
  "data": [],
  "pagination": {
    "page": 1,
    "pageSize": 10,
    "totalRows": 0,
    "totalPages": 0
  }
}

```

* **`status`** — the response status code, mirrored in the body so it can be read without inspecting transport-level status.
* **`message`** — a human-readable summary (`"Success"`, or an error description), surfaced directly in alerts and toasts.
* **`data`** — the actual payload: an array for list endpoints, an object for single-entity endpoints.
* **`pagination`** — included only on paginated list endpoints; omitted entirely for single-entity or non-paginated responses.

This shape is captured once as a generic type (`src/models/api.ts`) and reused everywhere instead of being redefined per feature:

```typescript
export interface ApiResponse<T> {
  status: number;
  message: string;
  data: T;
  pagination?: PaginationMetadata;
}

```

Every service function's return type is `Promise<ApiResponse<T>>` — for example `UserResponse` is `ApiResponse<User[]>`. This is what lets query hooks, mutation hooks, and the `DataTable` component all rely on `response.data` and `response.pagination` existing in the same place, on every feature, without exceptions.

---

## 3. Core Concepts

* **Strict Boundary Separation**: UI components never call `axios` directly. Data fetching must go through custom TanStack Query hooks, while global UI state (modals, active filters, auth session) belongs in Zustand stores.
* **Smart HTTP Client**: All network traffic runs through `axiosApi`. It automatically attaches JWT Bearer tokens and the active `Accept-Language` header to every request.
* **Automated JWT Refresh & Error Handling**: `401 Unauthorized` responses automatically attempt a token refresh and retry queued requests. Errors (`403 Forbidden`, `500 Server Error`, Network failures) trigger global popups via `useAlertStore`.
* **Automated Cache Invalidation**: Mutations must declare targeted cache invalidations (`queryClient.invalidateQueries`) to update the UI instantly without page reloads.

---

## 4. Engineering Standards

1. **Dedicated Service Contracts**: Define pure async functions in `src/service/<feature>.ts`.
2. **Encapsulated Custom Hooks**: Wrap service calls inside `src/hooks/use-<feature>.ts`.
3. **Dynamic Query Keys**: Always include reactive parameters in query keys (e.g., `['users', params]`) so TanStack Query re-fetches data when pagination or filters change.
4. **State Co-location**: Use Zustand (`src/stores/<feature>-store.ts`) strictly for non-server UI state (e.g., active modal types, selected IDs, filter parameters).
5. **Backend Contract Is Non-Negotiable**: Every endpoint must return the `{ status, message, data, pagination? }` envelope described in Section 2. Frontend code assumes it unconditionally — it is never a candidate for endpoint-specific mapping or defensive unwrapping.

---

## 5. How to Use & Implement

### Step 1: Define the Service Layer (`src/service/users.ts`)

```typescript
import axiosApi from "@/lib/axios";
import { User, UserQueryParams, UserResponse, UserStatus } from "@/models/user-model";

const USER_ENDPOINT = "/users";

export const getUsers = async (params?: UserQueryParams): Promise<UserResponse> => {
  const response = await axiosApi.get(USER_ENDPOINT, { params });
  return response?.data;
};

export const updateUser = async (userId: number, userData: Partial<User>): Promise<UserResponse> => {
  const response = await axiosApi.put(`${USER_ENDPOINT}/${userId}`, userData);
  return response?.data;
};

```

### Step 2: Define UI State in Zustand (`src/stores/users-store.ts`)

```typescript
import { create } from "zustand";
import { ID } from "@/models/api";
import { DialogType } from "@/models/alert-model";
import { UserQueryParams } from "@/models/user-model";

interface UsersState {
  open: DialogType | null;
  setOpen: (open: DialogType | null) => void;
  currentUserId: ID;
  setCurrentUserId: (id: ID) => void;
  queryParams: UserQueryParams;
  setQueryParams: (params: Partial<UserQueryParams>) => void;
}

export const useUsersStore = create<UsersState>((set) => ({
  open: null,
  setOpen: (open) => set({ open }),
  currentUserId: null,
  setCurrentUserId: (id) => set({ currentUserId: id }),
  queryParams: {},
  setQueryParams: (params) =>
    set((state) => ({ queryParams: { ...state.queryParams, ...params } })),
}));

```

### Step 3: Implement Data Hooks (`src/hooks/use-users.ts`)

```typescript
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getUsers, updateUser } from "@/service/users";
import { UserQueryParams, User } from "@/models/user-model";
import { useAlertStore } from "@/stores/alert-store";
import { AlertEnum } from "@/models/alert-model";

export function useUsers(params?: UserQueryParams) {
  return useQuery({
    queryKey: ["users", params],
    queryFn: () => getUsers(params),
  });
}

export function useUpdateUser() {
  const queryClient = useQueryClient();
  const { showAlert } = useAlertStore();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<User> }) => updateUser(id, data),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      queryClient.invalidateQueries({ queryKey: ["user", variables.id] });
      
      showAlert({
        message: data?.message || "User updated successfully!",
        type: AlertEnum.SUCCESS,
      });
    },
  });
}

```

---

## 6. Real Example Usage

Here is how a view component integrates query hooks, Zustand state, and mutations:

```tsx
import { useUsers, useUpdateUser } from "@/hooks/use-users";
import { useUsersStore } from "@/stores/users-store";

export function UserListTable() {
  const { queryParams, setQueryParams, setOpen, setCurrentUserId } = useUsersStore();
  
  // 1. Fetch server data using store filters
  const { data, isLoading } = useUsers(queryParams);
  
  // 2. Mutation for user updates
  const updateUserMutation = useUpdateUser();

  const handleEdit = (userId: number) => {
    setCurrentUserId(userId);
    setOpen("edit");
  };

  const handleToggleStatus = (userId: number, currentStatus: boolean) => {
    updateUserMutation.mutate({
      id: userId,
      data: { status: !currentStatus },
    });
  };

  if (isLoading) return <div>Loading users...</div>;

  return (
    <div>
      <input 
        type="text" 
        placeholder="Search users..." 
        onChange={(e) => setQueryParams({ search: e.target.value })}
      />

      <table>
        <tbody>
          {data?.data.map((user) => (
            <tr key={user.user_id}>
              <td>{user.first_name} {user.last_name}</td>
              <td>
                <button onClick={() => handleToggleStatus(user.user_id, Boolean(user.status))}>
                  Toggle Status
                </button>
                <button onClick={() => handleEdit(user.user_id)}>
                  Edit
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

```

---

## 7. Common Mistakes to Avoid

* ❌ **Storing Server Data in Zustand**: Do not copy API response data into a Zustand store. Let TanStack Query manage cache, revalidation, and loading states.
* ❌ **Static Query Keys for Dynamic Requests**: Omitting filter params from `queryKey: ['users']` prevents automatic re-fetching when search or pagination params change.
* ❌ **Bypassing Invalidation on Targeted Queries**: Invalidating `['users']` but failing to invalidate `['user', id]` leaves the individual detail view displaying stale data after an edit.
* ❌ **Duplicate Network Error Toasting**: Manually triggering error popups for `403` or `500` HTTP statuses in custom hooks—the central `axiosApi` interceptor handles global network failures automatically.
* ❌ **Deviating From the Response Envelope**: Returning a raw array, renaming `data` to something else (e.g. `results`), or dropping `pagination` on a list endpoint breaks every hook and component that destructures `response.data`/`response.pagination`, regardless of what backend framework produced the response.