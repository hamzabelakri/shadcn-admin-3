# Permissions (RBAC)

> **Status:** draft. Depends on `stores/auth-store.ts` (not yet seen) for where `user.permissions` originates.

Access control is driven by a `permissions` object attached to the logged-in user, read via `hooks/use-permissions.ts`.

## Permission string format

Each module's permissions are encoded as a **4-character string of `'0'`/`'1'`**, one digit per action — not a boolean map. This is defined in `lib/permissions.ts`:

```ts
enum PermissionType { VIEW = 0, CREATE = 1, EDIT = 2, DELETE = 3 }
type Permissions = Record<string, string> // e.g. { users: "1011", roles: "1111" }
```

So `permissions.users === "1011"` means: view ✅, create ❌, edit ✅, delete ✅ (reading left to right as VIEW/CREATE/EDIT/DELETE).

`hasPermission(permissions, module, action)` checks `permissions[module][action] === '1'`, with a length guard so a shorter-than-expected string doesn't throw. `getModulePermissions()` unpacks all four digits at once into `{ view, create, edit, delete }` — this is what backs `usePermissions()`'s `modulePermissions` object described below.

**If you add a new module**, the backend/seed data needs to provide a 4-character permission string for it — a missing or too-short string for a module is treated as "no permissions," not an error.

## `usePermissions()`

```ts
const { permissions, hasPermission, canAccess, canCreate, canUpdate, canDelete, modulePermissions } = usePermissions()
```

- Pulls `user.permissions` from `useAuthStore`.
- Generic helpers take a `module` string and an action:
  - `canAccess(module)` → view permission
  - `canCreate(module)` / `canUpdate(module)` / `canDelete(module)`
- `modulePermissions` is a **precomputed** object for the app's known modules (from `ModuleEnum`: `Roles`, `Users`, `Audits`, `Settings`), each with `canView/canCreate/canUpdate/canDelete` already resolved — so a component checking permissions for a known module doesn't need to call the generic helpers itself:

  ```tsx
  const { modulePermissions } = usePermissions()
  {modulePermissions.users.canCreate && <CreateUserButton />}
  ```

**Adding a new module:** add it to `ModuleEnum` (in `@/models/module-model`, not yet seen in full) and add a corresponding block to `modulePermissions` in `use-permissions.ts` — the generic helpers alone won't give you the precomputed convenience object for a new module without that addition.

## How permissions drive the sidebar

`hooks/use-sidebar.ts`'s `useFilteredSidebarData` takes the full static sidebar config and filters it live against `canAccess()`:

- An item with no `module` set is always shown (e.g. Dashboard, auth-adjacent links).
- An item with a `module` is shown only if `canAccess(module)` is true.
- Nested items are filtered recursively; a parent group is dropped entirely if all its children are filtered out (unless the parent itself has its own module permission).

This means **the sidebar is a direct function of the logged-in user's permissions** — it's not a static config toggled by role name, and two users with different permission sets will see structurally different sidebars, not just disabled links.

## Where else permission checks are expected

Not yet confirmed by the code we've seen, but worth checking for when we get to `apps/` and `components/`:
- Are action buttons (create/edit/delete) inside feature pages gated with `modulePermissions.<feature>.canX`, matching the sidebar pattern?
- Is there any *route-level* permission guard (e.g. a `beforeLoad` check per feature route), or is gating purely UI-level (hide the button, but the route itself isn't blocked)? This matters for docs — if it's UI-only, that's worth stating explicitly so nobody assumes route-level protection exists.

## Open questions

- Full shape of `permissions` on the user object (`@/models/user-model` / whatever `Permissions` type looks like in `@/lib/permissions`).
- Confirm whether any route currently checks permissions in `beforeLoad`, or if all gating is component-level.
