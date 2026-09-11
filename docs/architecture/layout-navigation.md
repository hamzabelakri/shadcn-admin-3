# Layout & Navigation Architecture

This guide details how the application shell, layout wrappers, dynamic permission-filtered sidebars, and main content containers are structured and extended.

[[toc]]

---

## 1. Architecture Flow

Layout management follows a wrapped component hierarchy that automatically injects navigation state, i18n keys, and permission filtering before rendering view components:

```

[ AuthenticatedLayout ] ──> (Providers: Search, Layout, Sidebar)
│
├─► [ Header ] ────> (Global Search, Language Switch, Theme, Profile)
├─► [ AppSidebar ] ─> [ useFilteredSidebarData Hook ] ──> [ usePermissions ]
│                                 │
│                                 ▼ (Recursive Filtering)
│                         [ NavGroup Component ] ────────> (i18n Translation)
│
└─► [ Main Container ] (Responsive Layout Shell: Fixed/Fluid Modes)
│
└─► [ Page / Outlet Views ]

```

---

## 2. Core Concepts

* **Unified Application Shell**: `AuthenticatedLayout` establishes global providers and standardizes space for fixed headers, contextual sidebars, and localized page wrappers.
* **Recursive Permission Filtering**: Navigation models enforce type safety via discriminants (`NavLink` vs `NavCollapsible`). The `useFilteredSidebarData` hook recursively scans group items and sub-items against `usePermissions().canAccess(module)` to scrub unauthorized routes and empty parent groups before rendering.
* **Automatic i18n Localization**: Navigation titles and group labels serve as dictionary keys. `NavGroup` uses `useTranslation()` to parse keys like `t('user_management')` dynamically.
* **Adaptive Main Layout Container**: The `<Main>` component standardizes page-level spacing and supports both `fluid` (full width) and `fixed` (flex-grow viewport clamped) modes.

---

## 3. Engineering Standards

1. **Config-Driven Navigation**: Define all application routes, titles, icons, and permission modules centrally in `src/components/layout/data/sidebar-data.ts`.
2. **Type-Safe Items**: Mark items as either `NavLink` (`url` required, no children) or `NavCollapsible` (`items` array required, no direct `url`).
3. **Module Binding**: Every restricted navigation item must explicitly set its corresponding `module` string. Unspecified modules default to public authenticated access.
4. **Standardized View Viewports**: Wrap all route views inside standard `<Main>` layout components rather than bare `<div>` containers.

---

## 4. How to Use & Implement

### Step 1: Define Sidebar Type Contracts (`src/models/sidebar-model.ts`)

```typescript
import { type LinkProps } from '@tanstack/react-router';

export type BaseNavItem = {
  title: string;
  badge?: string;
  icon?: React.ElementType;
  module?: string;
};

export type NavLink = BaseNavItem & {
  url: LinkProps['to'] | (string & {});
  items?: never;
};

export type NavCollapsible = BaseNavItem & {
  items: (BaseNavItem & { url: LinkProps['to'] | (string & {}) })[];
  url?: never;
};

export type NavItem = NavCollapsible | NavLink;

export type NavGroup = {
  title: string;
  items: NavItem[];
};

```

### Step 2: Implement Filter Hook (`src/hooks/use-sidebar.ts`)

```typescript
import { NavItem, SidebarData, NavGroup } from '@/models/sidebar-model';
import { usePermissions } from './use-permissions';

export function useFilteredSidebarData(sidebarData: SidebarData): SidebarData {
  const { canAccess } = usePermissions();

  const filterNavItems = (items: NavItem[]): NavItem[] => {
    return items
      .filter((item) => (item.module ? canAccess(item.module) : true))
      .map((item) => {
        if (item.items) {
          const filteredSubItems = filterNavItems(item.items);
          if (filteredSubItems.length > 0) return { ...item, items: filteredSubItems };
          if (item.module && canAccess(item.module)) return item;
          return null;
        }
        return item;
      })
      .filter((item): item is NavItem => item !== null);
  };

  return {
    ...sidebarData,
    navGroups: sidebarData.navGroups
      .map((group) => ({ ...group, items: filterNavItems(group.items) }))
      .filter((group) => group.items.length > 0),
  };
}

```

::: warning Always render through the filter hook
Mapping directly over the raw `sidebarData` config in a view — instead of the value returned by `useFilteredSidebarData` — renders empty group headers and unauthorized links for users without the matching permission.
:::

---

## 5. Real Example: Adding Collapsible Localized Routes

To add an "Audit Logs" section with sub-items under a parent group:

```typescript
// src/components/layout/data/sidebar-data.ts
{
  title: 'reporting', // Key translated via i18n
  items: [
    {
      title: 'audits',
      icon: ClipboardList,
      module: ModuleEnum.Audits,
      items: [
        {
          title: 'system_logs',
          url: '/audits/system',
        },
        {
          title: 'user_activity',
          url: '/audits/activity',
        },
      ],
    },
  ],
}

```

---

## 6. Common Mistakes to Avoid

* ❌ **Mixing NavLink and NavCollapsible Props**: Setting both `url` and `items` on a single navigation object violates TypeScript union constraints.
* ❌ **Bypassing the Recursive Filter**: Mapping directly over raw `sidebarData` in component views renders empty group headers for unauthorized users.
* ❌ **Hardcoding Display Text in Data Configurations**: Passing raw text instead of translation key IDs (e.g., `'User Management'` instead of `'user_management'`) breaks layout i18n support.