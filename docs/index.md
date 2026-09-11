---
layout: home

hero:
  name: "Frontend Architecture Guide"
  text: "Standardized React + Vite Template"
  tagline: "Comprehensive usage guide, patterns, and conventions for team developers."
  actions:
    - theme: brand
      text: Get Started
      link: /getting-started
    - theme: alt
      text: Architecture Overview
      link: /architecture/data-fetching

features:
  - title: Modular Data Layer
    details: Standardized API consumption combining Axios interceptors, central state management, and TanStack Query hooks.
  - title: Type-Safe Routing
    details: Declarative and strongly typed file-based routes using TanStack Router with automatic search param validation.
  - title: Permission-Filtered Layout
    details: A unified app shell with a recursively filtered, i18n-driven sidebar built on RBAC.
  - title: Dynamic Data Table
    details: A reusable table wrapper over TanStack Table with config-driven toolbars, filters, exports, and hybrid pagination.
  - title: Modal Architecture
    details: A single store-driven controller per feature powering Add/View/Edit/Delete/Block dialogs.
  - title: Alert & Dialog System
    details: Shared, accessible confirmation and status-toggle dialogs built on shadcn/ui.
---