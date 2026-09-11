# Modal Architecture

This guide details how the template structures feature-level modals: a single controller per feature that owns every dialog variant, and a mode-driven action modal that handles Add/View/Edit without duplicating components.

[[toc]]

---

## 1. Architecture Flow

```

[ DataTable Row Actions / Toolbar Add Button ]
│
▼ (dispatches DialogEnum via Zustand)
[ useUsersStore ] ──> (open, currentUserId)
│
▼
[ Feature Modals Controller ] ──> (e.g. UsersModals)
│
├───────────────┬───────────────┬───────────────┐
▼               ▼               ▼               ▼
[ Action Modal ]  [ DeleteAlert ]  [ StatusAlert ]  (shared Alert & Dialog components)
(Add/View/Edit)
│
▼
[ Mutation Hooks ] ──> (useCreateUser / useUpdateUser)
│
▼
[ onSuccess ] ──> (handleCloseModal resets store)

```

---

## 2. Core Concepts

* **Single Modal Controller per Feature**: One component (e.g. `UsersModals`) centralizes every dialog variant — Add, View, Edit, Delete, Block — instead of scattering modal state across the parent view.
* **Store-Driven Dialog State**: The active dialog is a single `open: DialogEnum | null` value in the feature's Zustand store, paired with a `currentUserId`-style field used to identify the target entity.
* **Lazy Entity Fetching**: The controller only fetches the full entity when a dialog referencing it is actually open, avoiding unnecessary requests while the table is idle.
* **Tri-Mode Action Modal**: A single form modal handles Add, View, and Edit through one `mode` prop rather than three near-duplicate components, toggling field `disabled` state and footer actions accordingly.
* **Reused Shared Alerts**: `DeleteAlert` and `StatusAlert` from the [Alert & Dialog System](./alert-dialog-components) are composed directly inside the feature controller — feature modals never redefine confirmation UI.

---

## 3. Engineering Standards

1. **One Controller, One Store Slice**: Every feature's modal controller must read `open`/`setOpen` and the current entity ID from that feature's own Zustand store — never introduce local `useState` for dialog visibility.
2. **Enum-Driven Dialog Types**: Define all dialog variants for a feature as a shared `DialogEnum` (`ADD`, `VIEW`, `EDIT`, `DELETE`, `BLOCK`) so `open === DialogEnum.X` checks stay type-safe and consistent across the codebase.
3. **Mode-Aware Field Disabling**: Any form rendered inside a tri-mode modal must set `disabled={isView}` on its fields rather than conditionally rendering separate read-only markup.
4. **Single Close Handler**: Provide one `handleCloseModal` that resets the store (`setOpen(null)`, `setCurrentUserId(null)`), and pass it to every dialog's `onClose`.
5. **Mutation Success Closes the Modal**: Every create/update/delete mutation must call the shared close handler inside its `onSuccess`, never inside the submit handler itself, so the modal only closes after the server confirms the change.
6. **RBAC Inside the Modal**: Action availability (e.g., an Edit button surfaced from View mode) must re-check permissions, not rely solely on upstream row-action hiding.

---

## 4. How to Use & Implement

### Step 1: Define the Dialog Enum (`src/models/alert-model.ts`)

Every feature that needs modals declares its dialog variants as an enum. This is what the controller and every trigger (row actions, add button) will reference.

```typescript
export enum DialogEnum {
  ADD = 'add',
  VIEW = 'view',
  EDIT = 'edit',
  DELETE = 'delete',
  BLOCK = 'block',
}

export type ModalMode = DialogEnum.ADD | DialogEnum.VIEW | DialogEnum.EDIT

```

### Step 2: Add Dialog State to the Feature Store

Add an `open` field and a `currentId` field to the feature's Zustand store (see [Data Fetching & State](./data-fetching) for the full store pattern):

```typescript
// src/stores/users-store.ts
open: DialogEnum | null
setOpen: (open: DialogEnum | null) => void
currentUserId: ID
setCurrentUserId: (id: ID) => void

```

### Step 3: Trigger Dialogs from Row Actions or the Toolbar

Any trigger — a table row action, a toolbar "Add" button — simply sets the target entity and the desired dialog type. It never renders or imports the modal itself.

Row actions call both setters inside each handler (`src/apps/users/table/users-columns.tsx`):

```tsx
<DataTableRowActions
  row={row}
  onView={(data) => {
    setCurrentUserId(data.user_id)
    setOpen(DialogEnum.VIEW)
  }}
  onEdit={(data) => {
    setCurrentUserId(data.user_id)
    setOpen(DialogEnum.EDIT)
  }}
  onDelete={(data) => {
    setCurrentUserId(data.user_id)
    setOpen(DialogEnum.DELETE)
  }}
  onBlock={(data) => {
    setCurrentUserId(data.user_id)
    setOpen(DialogEnum.BLOCK)
  }}
  canView={modulePermissions.users.canView}
  canEdit={!isSuperAdmin && modulePermissions.users.canUpdate}
  canDelete={!isSuperAdmin && modulePermissions.users.canDelete}
/>

```

The toolbar's add button does the same with no target entity, since Add mode has none yet (`src/apps/users/table/data.ts`):

```typescript
tableAddProps: canCreateUser
  ? {
      addButtonLabel: t('add_user'),
      addButtonIcon: IconUserPlus,
      addFunction: () => setOpen(DialogEnum.ADD),
    }
  : undefined,

```

Both live in the same hooks that already define columns and toolbar config for the [Dynamic Data Table](./data-table-component) — no extra wiring is needed beyond calling `setOpen`/`setCurrentUserId`.

### Step 4: Build the Modal Controller (`src/apps/<feature>/<feature>-modal/index.tsx`)

The controller reads `open`/`currentId` from the store, fetches the entity only when needed, and renders the matching dialog. Use this shape for any new feature:

```tsx
export function UsersModals() {
  const { open, setOpen, currentUserId, setCurrentUserId } = useUsersStore()
  const { data: user } = useUser(currentUserId) // only fetches while a dialog is open

  const handleCloseModal = () => {
    setOpen(null)
    setCurrentUserId(null)
  }

  return (
    <>
      <UsersActionModal
        open={open === DialogEnum.ADD}
        onClose={handleCloseModal}
        mode={DialogEnum.ADD}
      />

      {user && (
        <>
          <UsersActionModal
            open={open === DialogEnum.VIEW || open === DialogEnum.EDIT}
            onClose={handleCloseModal}
            user={user}
            mode={open as DialogEnum.VIEW | DialogEnum.EDIT}
            switchToEdit={() => setOpen(DialogEnum.EDIT)}
          />

          <DeleteAlert
            open={open === DialogEnum.DELETE}
            onClose={handleCloseModal}
            onConfirm={() => deleteUserMutation.mutate(user.user_id, { onSuccess: handleCloseModal })}
          />

          <StatusAlert
            open={open === DialogEnum.BLOCK}
            onClose={handleCloseModal}
            isBlocked={!!user.status}
            onConfirm={() => updateStatusMutation.mutate(
              { id: user.user_id, data: { status: !user.status } },
              { onSuccess: handleCloseModal }
            )}
          />
        </>
      )}
    </>
  )
}

```

### Step 5: Build the Action Modal's `mode` Prop Behavior

The Add/View/Edit modal reads a single `mode` prop and derives everything from it — no separate components per mode:

```tsx
const isEdit = mode === DialogEnum.EDIT
const isView = mode === DialogEnum.VIEW
const isAdd = mode === DialogEnum.ADD

// Fields:
<Input disabled={isView} {...field} />

// Footer:
{isView && canEdit && <Button onClick={switchToEdit}>{t('edit')}</Button>}
{!isView && <Button type="submit">{t('submit')}</Button>}

```

::: warning
`canEdit` here must be re-checked inside the modal, not just relied on from the row action that opened it. If the modal can be reached another way, an unchecked Edit button becomes a client-side-only gate.
:::

### Step 6: Mount the Controller Once in the Feature View

```tsx
// src/apps/users/index.tsx
export function Users() {
  return (
    <>
      <Main>
        <DataTable /* ...toolbar & row actions dispatch DialogEnum via the store... */ />
      </Main>

      <UsersModals />
    </>
  )
}

```

---

## 5. Real Example Usage

Putting it together across the Users feature — trigger, store, and controller never import each other directly, they only share the Zustand store:

```tsx
// src/apps/users/index.tsx
export function Users() {
  const toolbarProps = useUserToolbarProps() // wires tableAddProps.addFunction -> setOpen(DialogEnum.ADD)
  const columns = useUserColumns()           // wires row actions -> setOpen(DialogEnum.X)

  return (
    <>
      <Main>
        <DataTable columns={columns} toolbarProps={toolbarProps} /* ... */ />
      </Main>

      {/* Reacts to whatever open/currentUserId the trigger set */}
      <UsersModals />
    </>
  )
}

```

This is the full contract a new feature needs to implement modals: a `DialogEnum`, `open`/`currentId` in its store, row-action and toolbar triggers that set both, and one controller mounted alongside the table that renders the right dialog for the current state.

---

## 6. Common Mistakes to Avoid

* ❌ **Local Dialog State**: Using `useState` for `isOpen`/`selectedItem` inside a feature view instead of the Zustand store breaks the connection between row actions (in a different component) and the modal controller.
* ❌ **Duplicated Mode Components**: Creating separate `AddModal`, `ViewModal`, and `EditModal` components instead of one mode-driven modal multiplies maintenance and risks the three falling out of sync.
* ❌ **Fetching the Entity Unconditionally**: Calling the entity hook without gating dialogs behind a truthy check causes dialogs to flash with stale or undefined data before the fetch resolves.
* ❌ **Closing on Submit Instead of Success**: Calling the close handler directly inside the submit handler rather than the mutation's `onSuccess` closes the modal even if the request fails, hiding the error from the user.
* ❌ **Skipping RBAC in the Modal**: Omitting permission checks around in-modal actions (like an Edit button inside View mode) assumes upstream row-action hiding is the only gate, which is unsafe if the modal can be reached another way.
* ❌ **Reimplementing Confirmation UI**: Building custom confirm dialogs for delete/status-toggle actions instead of reusing `DeleteAlert`/`StatusAlert` breaks visual and behavioral consistency with the rest of the template.