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

## 2. Core Concepts

* **Strict Boundary Separation**: UI components never call `axios` directly. Data fetching must go through custom TanStack Query hooks, while global UI state (modals, active filters, auth session) belongs in Zustand stores.
* **Smart HTTP Client**: All network traffic runs through `axiosApi`. It automatically attaches JWT Bearer tokens and the active `Accept-Language` header to every request.
* **Automated JWT Refresh & Error Handling**: `401 Unauthorized` responses automatically attempt a token refresh and retry queued requests. Errors (`403 Forbidden`, `500 Server Error`, Network failures) trigger global popups via `useAlertStore`.
* **Automated Cache Invalidation**: Mutations must declare targeted cache invalidations (`queryClient.invalidateQueries`) to update the UI instantly without page reloads.

---

## 3. Engineering Standards

1. **Dedicated Service Contracts**: Define pure async functions in `src/service/<feature>.ts`.
2. **Encapsulated Custom Hooks**: Wrap service calls inside `src/hooks/use-<feature>.ts`.
3. **Dynamic Query Keys**: Always include reactive parameters in query keys (e.g., `['users', params]`) so TanStack Query re-fetches data when pagination or filters change.
4. **State Co-location**: Use Zustand (`src/stores/<feature>-store.ts`) strictly for non-server UI state (e.g., active modal types, selected IDs, filter parameters).

---

## 4. How to Use & Implement

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

## 5. Real Example Usage

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

## 6. Common Mistakes to Avoid

* ❌ **Storing Server Data in Zustand**: Do not copy API response data into a Zustand store. Let TanStack Query manage cache, revalidation, and loading states.
* ❌ **Static Query Keys for Dynamic Requests**: Omitting filter params from `queryKey: ['users']` prevents automatic re-fetching when search or pagination params change.
* ❌ **Bypassing Invalidation on Targeted Queries**: Invalidating `['users']` but failing to invalidate `['user', id]` leaves the individual detail view displaying stale data after an edit.
* ❌ **Duplicate Network Error Toasting**: Manually triggering error popups for `403` or `500` HTTP statuses in custom hooks—the central `axiosApi` interceptor handles global network failures automatically.