# Introduction

This is the architecture guide for the company's standardized frontend dashboard template — a React + Vite starting point built to bootstrap new internal projects quickly, without every team reinventing data fetching, auth, layout, tables, and modals from scratch.

This is **not** a generated API reference. You won't find line-by-line explanations of every file. Instead, each guide documents one architectural concern, why it's built that way, the standards to follow, and a real example pulled straight from the template.

---

## What's in the Template

* **React + Vite** — the application shell and build tooling.
* **TanStack Router** — type-safe, file-based routing with search param validation, layout nesting, and auth guards.
* **TanStack Query** — server state, caching, and mutations.
* **Axios + Zustand** — a central Axios instance with interceptors for auth/errors, and Zustand for local/UI state (modals, filters, auth session).
* **Tailwind CSS + Radix UI + shadcn/ui** — the styling and component primitives (dialogs, forms, tables, alerts).
* **react-i18next** — localization across UI copy and validation messages.
* **react-hook-form + Zod** — form state and schema validation.

---

## How the Docs Are Organized

Each guide under **Core Architecture** follows the same structure, so once you know one you know them all:

1. **Architecture Flow** — a diagram of how data/state moves through the layer.
2. **Core Concepts** — the design decisions and why they exist.
3. **Engineering Standards** — the rules to follow when extending the template.
4. **How to Use & Implement** — step-by-step, with real file paths and real code.
5. **Real Example Usage** — a full feature (usually `Users`) tying it together.
6. **Common Mistakes to Avoid** — what breaks when a standard is skipped.

---

## Where to Start

If you're bootstrapping a new feature, read these in order:

1. **[Data Fetching & State](./architecture/data-fetching)** — the service → hook → store boundary every feature follows.
2. **[Routing & Protection](./architecture/routing)** — how routes are registered and guarded.
3. **[Layout & Navigation](./architecture/layout-navigation)** — the app shell and permission-filtered sidebar.
4. **[Dynamic Data Table](./architecture/data-table-component)** — the reusable table used by nearly every list view.
5. **[Modal Architecture](./architecture/modal-components)** — how Add/View/Edit/Delete dialogs are wired to a feature's table.
6. **[Alert & Dialog System](./architecture/alert-dialog-components)** — the shared confirmation components modals reuse.

The `Users` feature (`src/apps/users`) implements every pattern in this guide end to end and is referenced throughout as the canonical example — it's the best place to look when something in the docs is unclear.