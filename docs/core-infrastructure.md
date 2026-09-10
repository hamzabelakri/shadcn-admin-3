---
outline: deep
---

# Core Infrastructure: API & Localization

## Architecture
The template standardizes communication and global language support at the root layer. Network requests flow through a pre-configured Axios instance (`axiosApi`), while multi-language support is handled via `i18next` with cookie persistence and automatic header synchronization.

## Concept
* **Centralized API Client:** All backend communication must use the pre-configured `axiosApi` instance. It automatically injects authentication tokens and handles language headers.
* **Declarative Localization:** Translations are decoupled from components using keys, supporting English, French, and Right-to-Left (RTL) Arabic out of the box.

## Standard
* **Never** use raw `fetch` or create separate `axios.create()` instances in feature modules.
* **Always** use `axiosApi` for data fetching or pair it cleanly with TanStack Query.
* **Always** use translation keys via `react-i18next` rather than hardcoding user-facing strings.

## How to Use It

### 1. Making API Requests
Import `axiosApi` and use it inside your data fetching functions or TanStack Query hooks:

```typescript
import axiosApi from '@/lib/axios'

export async function fetchUserProfile(userId: string) {
  const { data } = await axiosApi.get(`/users/${userId}`)
  return data
}
