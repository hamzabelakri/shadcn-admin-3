# Routing & Auth Protection Architecture

This guide details how the template handles client-side routing, layout nesting, role-based access control (RBAC), and route guarding using **TanStack Router**.

[[toc]]

---

## 1. Core Architecture

The routing layer relies on TanStack Router to provide strict type safety, URL search parameter validation, and automated authentication checks before route components render.

```

[ Root Route (__root.tsx) ]
│
┌────────────────┴────────────────┐
▼                                 ▼
[ Unauthenticated Layout ]         [ Authenticated Layout ]
(Login, Forgot Password)          (Sidebar, Header, App Shell)
│
▼
[ Protected Sub-Routes ]
(Users, Dashboard, Settings)

```

---

## 2. Key Concepts

* **Code-Based / Tree-Based Routing**: Routes are explicitly organized using TanStack Router's route hierarchy.
* **Layout Isolation**: `AuthenticatedLayout` wraps all protected views to enforce authentication status and provide the top-level app UI frame.
* **BeforeLoad Guards**: Auth checks execute inside `beforeLoad` functions before a route completes navigation, preventing unauthorized layout flashing or content leakage.
* **Granular Permission Checks**: Component rendering and action triggers validate permissions via custom hooks driven by the user's assigned role.

---

## 3. Route Protection Mechanics

### Authenticated Layout Guard (`AuthenticatedLayout`)

The layout route checks user authentication before rendering child routes. If unauthenticated, it immediately redirects the user to `/login` while preserving the intended target URL for post-login redirecting.

```tsx
// src/routes/_authenticated.tsx
import { createFileRoute, redirect, Outlet } from '@tanstack/react-router';
import { useAuthStore } from '@/stores/auth-store';

export const Route = createFileRoute('/_authenticated')({
  beforeLoad: async ({ location }) => {
    const isAuthenticated = useAuthStore.getState().isAuthenticated;

    if (!isAuthenticated) {
      throw redirect({
        to: '/login',
        search: {
          redirect: location.href,
        },
      });
    }
  },
  component: AuthenticatedLayoutComponent,
});

function AuthenticatedLayoutComponent() {
  return (
    <div className="app-shell">
      {/* Sidebar & Header components here */}
      <main>
        <Outlet />
      </main>
    </div>
  );
}

```

---

## 4. Role-Based Access Control (RBAC)

The template separates route protection (login status) from feature authorization (permissions). Permission checks are driven by custom hooks:

### Usage in Components (`src/hooks/use-permissions.ts`)

```tsx
import { useAuthStore } from '@/stores/auth-store';

export function usePermissions() {
  const user = useAuthStore((state) => state.user);

  const hasPermission = (requiredPermission: string) => {
    if (!user) return false;
    return user.permissions?.includes(requiredPermission) ?? false;
  };

  const hasRole = (role: string) => {
    return user?.role === role;
  };

  return { hasPermission, hasRole };
}

```

### Protecting View Elements & Action Buttons

```tsx
import { usePermissions } from '@/hooks/use-permissions';

export function DeleteUserButton({ userId }: { userId: number }) {
  const { hasPermission } = usePermissions();

  // Hide action if missing permission
  if (!hasPermission('users:delete')) {
    return null;
  }

  return (
    <button onClick={() => handleDelete(userId)}>
      Delete User
    </button>
  );
}

```

::: warning Client-side hiding is UX, not security
Hooks like `usePermissions` control what's *rendered* — they never substitute for backend authorization. Every API endpoint behind a guarded action or route must independently enforce the same permission check server-side.
:::

---

## 5. Adding a New Protected Route

To create a new route under the authenticated shell:

1. **Define the Route**: Create a file inside `src/routes/_authenticated/<feature>.tsx`.
2. **Register the Route**: Use `createFileRoute('/_authenticated/<feature>')`.
3. **Connect Views & Hooks**: Bind store state, custom hooks, and view components.

```tsx
// src/routes/_authenticated/users.tsx
import { createFileRoute } from '@tanstack/react-router';
import { UserListTable } from '@/components/users/user-list-table';

export const Route = createFileRoute('/_authenticated/users')({
  component: UsersPage,
});

function UsersPage() {
  return (
    <div className="container p-6">
      <h1 className="text-2xl font-bold mb-4">User Management</h1>
      <UserListTable />
    </div>
  );
}

```

---

## 6. Common Mistakes to Avoid

* ❌ **Checking Auth Inside `useEffect`**: Checking user sessions inside component lifecycle hooks causes layout flickers before redirection. Always perform checks in the route's `beforeLoad` function.
* ❌ **Relying Solely on UI Hiding for Security**: Hiding buttons or pages client-side is for UX. Ensure all API endpoints behind these actions are protected by backend authorization middleware.
* ❌ **Hardcoding Navigation Links**: Use TanStack Router's `<Link to="/users" />` component instead of native `<a>` tags to preserve SPA state and client-side routing.