# Alert & Dialog System Architecture

This guide documents the design standards, component architecture, and integration patterns for application-wide confirmation, status toggles, and deletion alert dialogs.

[[toc]]

---

## 1. Architecture Flow

Alert dialogs follow a unified presentation layer that standardizes modal layout, status iconography, dynamic translations, and action state transitions:

```

[ Trigger Action / Store Dispatch ]
│
┌─────────────────────────┼─────────────────────────┐
▼                         ▼                         ▼
[ DeleteAlert Component ]  [ StatusAlert Component ]  [ ConfirmAlert Component ]
│                         │                         │
├─► (Modal Container)     ├─► (Modal Container)     ├─► (Global Alert Store)
├─► (Pulse Icon Badge)    ├─► (Lock/Unlock Badge)   ├─► (Auto-Dismiss Timer)
└─► (Cancel / Action)     └─► (Cancel / Action)     └─► (Single Action Confirm)
│                         │                         │
└─────────────────────────┴─────────────────────────┘
│
▼
[ shadcn/ui AlertDialog ]
│
▼
[ Execution / Callback ]

```

---

## 2. Core Concepts

* **Visual Status Identifiers**: Standardized circular badges with semantic background tinting (`bg-destructive/10`, `bg-success/10`, `bg-warning/10`) and matching animated icons provide immediate visual cues prior to reading copy.
* **Controlled & Uncontrolled Dialog Modes**: Modal dialogs support both imperative store-based triggering (`ConfirmAlert` via `useAlertStore`) and component-driven state control (`DeleteAlert`, `StatusAlert`).
* **Loading & Async States**: Danger and toggle actions automatically reflect mutation states via embedded `<Spinner />` components while disabling dual user inputs to prevent duplicate execution.
* **Centered Action Footers**: Footer action elements are explicitly centered (`sm:justify-center`) to enforce visual symmetry across alert confirmation interfaces.

::: warning
Always wire `disabled={isLoading}` on the confirm action. Without it, a slow mutation lets a user click twice and fire the request (e.g. a delete) more than once.
:::

---

## 3. Engineering Standards

1. **Standard Width Restrictions**: Enforce consistent modal dialog widths across all implementations using fixed width constraints (e.g., `w-120` or `w-122`).
2. **Dynamic i18n Translation**: Mandatory integration with `useTranslation()` for standard user actions like `t('cancel')`, `t('delete')`, and `t('deleting')`.
3. **Explicit Button Variants**: Apply corresponding button variant mappings (`destructive2`, `success`, `warning`) directly via the `buttonVariants` helper function on `AlertDialogAction`.
4. **Icon Visual Feedback**: Action icons should reflect state changes dynamically (e.g., swapping `IconLock` and `IconLockOpen` based on entity status).

---

## 4. Component Implementations

### Status Alert Dialog (`src/components/shared/alert/status-alert.tsx`)

```tsx
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { buttonVariants } from '@/components/ui/button'
import { Spinner } from '@/components/ui/shadcn-io/spinner'
import { IconLock, IconLockOpen } from '@tabler/icons-react'
import { useTranslation } from 'react-i18next'

interface Props {
  open: boolean
  onClose: () => void
  isLoading?: boolean
  onConfirm: () => void
  isBlocked: boolean
  title?: string
  blockLoadingText?: string
  unblockLoadingText?: string
  unblockButtonText?: string
  blockButtonText?: string
}

export function StatusAlert({
  open,
  onClose,
  isBlocked,
  isLoading,
  onConfirm,
  title,
  blockLoadingText,
  unblockLoadingText,
  unblockButtonText,
  blockButtonText,
}: Props) {
  const { t } = useTranslation()

  return (
    <AlertDialog open={open}>
      <AlertDialogContent className="w-122">
        <AlertDialogHeader className="items-center">
          <AlertDialogTitle>
            {isBlocked ? (
              <div className="bg-destructive/10 mb-2 mx-auto flex h-14 w-14 items-center justify-center rounded-full">
                <IconLock className="text-destructive h-7 w-7" />
              </div>
            ) : (
              <div className="mb-2 mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-green-600/10">
                <IconLockOpen className="h-7 w-7 text-green-600" />
              </div>
            )}
            {title}
          </AlertDialogTitle>
        </AlertDialogHeader>

        <AlertDialogFooter className="mt-2 sm:justify-center">
          <AlertDialogCancel onClick={onClose}>{t('cancel')}</AlertDialogCancel>

          <AlertDialogAction
            className={buttonVariants({ variant: isBlocked ? 'destructive2' : 'success' })}
            disabled={isLoading}
            onClick={onConfirm}
          >
            {isLoading ? (
              <>
                <Spinner variant="circle" />
                {isBlocked ? blockLoadingText : unblockLoadingText}
              </>
            ) : (
              <>
                {isBlocked ? <IconLock /> : <IconLockOpen />}
                {isBlocked ? blockButtonText : unblockButtonText}
              </>
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

```

### Delete Alert Dialog (`src/components/shared/alert/delete-alert.tsx`)

```tsx
import { OctagonAlert, TrashIcon } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { buttonVariants } from '@/components/ui/button'
import { Spinner } from '@/components/ui/shadcn-io/spinner'

interface Props {
  open: boolean
  onClose: () => void
  onConfirm: () => void
  isLoading?: boolean
  confirmDeleteText?: string
  description?: string
}

export function DeleteAlert({
  open,
  onClose,
  onConfirm,
  isLoading,
  confirmDeleteText,
  description,
}: Props) {
  const { t } = useTranslation()

  return (
    <AlertDialog open={open}>
      <AlertDialogContent className="w-122">
        <AlertDialogHeader className="items-center">
          <AlertDialogTitle>
            <div className="bg-destructive/10 mb-2 mx-auto flex h-14 w-14 items-center justify-center rounded-full">
              <OctagonAlert className="text-destructive h-7 w-7 animate-pulse" />
            </div>
            {confirmDeleteText}
          </AlertDialogTitle>

          {description && (
            <AlertDialogDescription className="mt-2 text-center">
              {description}
            </AlertDialogDescription>
          )}
        </AlertDialogHeader>

        <AlertDialogFooter className="mt-2 sm:justify-center">
          <AlertDialogCancel onClick={onClose}>{t('cancel')}</AlertDialogCancel>

          <AlertDialogAction
            className={buttonVariants({ variant: 'destructive2' })}
            disabled={isLoading}
            onClick={onConfirm}
          >
            {isLoading ? (
              <>
                <Spinner variant="circle" />
                {t('deleting')}
              </>
            ) : (
              <>
                <TrashIcon />
                {t('delete')}
              </>
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

```

---

## 5. Common Mistakes to Avoid

* ❌ **Uncontrolled Auto-Dismiss Timers**: Failing to clean up timers via `clearTimeout` in global notification alerts leads to memory leaks and unexpected state resets.
* ❌ **Missing Loading Indicators**: Executing destructive backend mutations without setting `isLoading` leaves action buttons active, causing duplicate submissions.
* ❌ **Inconsistent Footer Alignment**: Omitting the `sm:justify-center` utility class breaks the visual balance established across confirmation screens.
* ❌ **Raw String Hardcoding**: Passing un-localized plain text labels directly to default action/cancel controls rather than leveraging standard `i18n` dictionary keys.