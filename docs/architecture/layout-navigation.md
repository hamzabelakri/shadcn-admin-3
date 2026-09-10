# Layout & Navigation Architecture

This guide details how the application shell, layout wrappers, dynamic permission-filtered sidebars, and main content containers are structured and extended.

---

## 1. Architecture Flow

Layout management follows a wrapped component hierarchy that automatically injects navigation state, themes, and permission filtering before rendering view components:


```

[ AuthenticatedLayout ] ──> (Providers: Search, Layout, Sidebar)
│
├─► [ Header ] ────> (Global Search, Language, Theme, User Profile)
├─► [ AppSidebar ] ─> (Filtered via useFilteredSidebarData + Permission Hook)
│
└─► [ Main Container ] (Responsive Layout Shell with Fixed/Fluid Modes)
│
└─► [ Page / Outlet Views ]

```

---

## 2. Core Concepts

* **Unified Application Shell**: `AuthenticatedLayout` establishes global providers and standardizes space for fixed headers, contextual sidebars, and localized page wrappers.
* **Permission-Driven Sidebar Navigation**: The sidebar does not hardcode static visibility. It processes `sidebarData` through `useFilteredSidebarData`, automatically hiding navigation items or groups if the authenticated user lacks the required module permissions.
* **Adaptive Main Layout Container**: The `Main` component standardizes page-level spacing and supports both `fluid` (full width) and `fixed` (flex-grow viewport clamped) modes.

---

## 3. Engineering Standards

1. **Config-Driven Navigation**: Define all application routes, titles, icons, and permission modules centrally in `src/components/layout/data/sidebar-data.ts`.
2. **Permission Binding**: Every navigation item in `sidebarData` must explicitly set its corresponding `module` field using `ModuleEnum`.
3. **Standardized View Viewports**: Wrap all route views inside the standard `<Main>` layout component rather than bare `<div>` containers.

---

## 4. How to Use & Implement

### Step 1: Configure Sidebar Navigation (`src/components/layout/data/sidebar-data.ts`)

Add new navigation groups or items bound to module permissions:

```typescript
import { ModuleEnum } from '@/models/module-model';
import { SidebarData } from '@/models/sidebar-model';
import { Users, ShieldCheck } from 'lucide-react';

export const sidebarData: SidebarData = {
  // ... user & teams
  navGroups: [
    {
      title: 'management',
      items: [
        {
          title: 'user_management',
          url: '/users',
          icon: Users,
          module: ModuleEnum.Users, // Filtered automatically if permission is missing
        },
      ],
    },
  ],
};

```

### Step 2: Wrap Feature Pages in the Main Container

Use the `<Main>` wrapper to enforce padding, auto-centering, and optional scroll containment:

```tsx
import { Main } from '@/components/layout/main';

export function UsersPage() {
  return (
    // 'fixed' enables viewport height clamping for scrollable tables
    // 'fluid' removes max-width limits for dense layouts
    <Main fixed fluid="{false}">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold">User Management</h1>
      </div>
      {/* Table or View Components */}
    </Main>
  );
}

```

---

## 5. Real Example: Adding a New Module to Navigation

To add a new "Analytics" page with dynamic sidebar access:

1. **Register the Module in `ModuleEnum**`: Ensure `ModuleEnum.Analytics` exists.
2. **Update Navigation Config**:

```typescript
// src/components/layout/data/sidebar-data.ts
{
  title: 'reporting',
  items: [
    {
      title: 'analytics',
      url: '/analytics',
      icon: BarChart3,
      module: ModuleEnum.Analytics,
    },
  ],
}

```

When a user logs in, `useFilteredSidebarData` queries the user's `permissions` state via `usePermissions()`. If `canAccess(ModuleEnum.Analytics)` returns `false`, the item is removed from the DOM automatically.

---

## 6. Common Mistakes to Avoid

* ❌ **Hardcoding Navigation Visibility Checks in Sidebar UI**: Writing custom `if/else` checks inside `AppSidebar` directly instead of attaching `module` keys to `sidebarData`.
* ❌ **Manual Page Heights & Overflow Spanning**: Using custom Tailwind classes like `h-screen w-screen overflow-scroll` on pages instead of leveraging standard `<Main fixed>` props.
* ❌ **Omitting Module Enums**: Defining a sidebar item without a `module` attribute causes it to bypass the security filter, making it visible to unprivileged users.