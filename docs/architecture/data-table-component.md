# Dynamic Data Table Architecture

This guide details the structure, properties, toolbar integrations, row action patterns, pagination mechanisms, and implementation standards for the reusable application-wide dynamic data table component.

[[toc]]

---

## 1. Architecture Flow

The `DataTable` component acts as a wrapper around `@tanstack/react-table`, standardizing table state, card layout wrappers, dynamic toolbar controls, row action triggers, and hybrid (client/server-side) pagination controls.

```

[ Parent View / Page ]
│
┌────────────────┴────────────────┐
▼                                 ▼
[ Column Definitions ]           [ Data & Pagination ]
(Custom Hooks e.g.               (Zustand / TanStack Query
useUserColumns)                  State Sync)
│                                 │
└────────────────┬────────────────┘
▼
[ DataTable Component ]
│
┌─────────────────────┼─────────────────────┐
▼                     ▼                     ▼
[ Toolbar Component ]   [ Table Container ]  [ Pagination Component ]
(Config via Hook:       (Headers, Rows,      (Page Size Select,
useUserToolbarProps)    Loading, Empty)      Page Jump, Dual Mode
Backend/Client Sync)

```

---

## 2. Core Concepts

* **Feature-Level Custom Hooks**: Dynamic configurations (columns, toolbar specifications, RBAC rules) are cleanly encapsulated using custom hooks (e.g., `useUserColumns()`, `useUserToolbarProps()`).
* **State Management Integration**: Syncs pagination indices, sort orders, and filter states directly through Zustand stores (`useUsersStore`) or TanStack Query (`useUsers(queryParams)`).
* **Config-Driven Toolbars**: Features like debounced global search, custom filter forms, multi-format exports (`PDF`, `EXCEL`), entity add controls, and contextual extra actions are conditionally mounted via `toolbarProps`.
* **Debounced Search Dispatch**: `DataTableSearch` automatically debounces input queries (150ms delay) and resets pagination back to page 1 (`page: 1`) via `setQueryParams`.
* **Dynamic Popover Filtering**: `DataTableFilter` parses field specifications (`dropdown`, `date`, `text`, `number`) and formats ISO date-time bounds (`yyyy-MM-dd HH:mm:ss`) for automated query parameter synchronization.
* **Export Action Menu**: `DataTableExport` exposes a dropdown trigger invoking `exportFn` with typed targets (`FileTypeOptions.PDF` or `FileTypeOptions.EXCEL`).
* **Contextual Extra Action Button**: `DataTableExtra` renders custom action triggers (e.g., batch operations, sync, refresh) complete with pending states (`isPending`), spinner animations, and tooltip contextual labels.
* **Standardized Row Action Bar**: `DataTableRowActions` provides a unified cell action bar featuring permission flags (`canView`, `canEdit`, `canDelete`), state-aware toggles (blocking/unblocking), audit history triggers (`onCompare`), and color-coded tooltips.
* **Dual-Mode Pagination Engine**: `DataTablePagination` seamlessly pivots between client-side TanStack pagination states and server-driven query parameters (`setQueryParams`) based on the presence of the `pagination` metadata object.
* **Page-Size Reset Mechanism**: Modifying the rows-per-page drop-down automatically resets the active index back to page 1 (`page: 1`) to eliminate out-of-bounds query anomalies.
* **Toolbar Layout Model**: Responsive flex container (`flex-col-reverse sm:flex-row`) positioning search and view controls on the left, and filter/export/action triggers on the right.
* **Integrated Loading & Empty States**: Internally manages loading skeletons (`DataTableLoading`) and localized fallbacks (`no_results_found`).
* **Column Meta Extension**: Controls cell alignment and responsive sizing using `meta.className` declarations inside column definitions.

---

## 3. Engineering Standards

1. **Hook-Based Column Instantiation**: Define table columns inside custom React hooks (`useUserColumns`) to safely access translation hooks (`useTranslation`), global stores, and RBAC guards (`usePermissions`).
2. **Hook-Based Toolbar Configuration**: Encapsulate toolbar parameters inside dedicated hooks (`useUserToolbarProps`) to separate UI layouts from business logic and dynamic query filters.
3. **Memoized Calculations**: Always wrap table data arrays, pagination objects, and column declarations inside `useMemo` to prevent unnecessary table re-renders.
4. **Zustand Query Synchronization**: Bind `queryParams` and `setQueryParams` from global Zustand stores directly to `<DataTable />` to keep URL/store parameters synchronized with API requests.
5. **Conditional Toolbar Slots**: Pass configuration objects via `toolbarProps` to activate toolbar slots (`tableSearchProps`, `tableFilterProps`, `tableAddProps`, `exportFunction`, `extraAction`).
6. **Debounced Search Inputs**: Always pass `setQueryParams` inside `tableSearchProps` so search term updates automatically trigger API queries while resetting page indices.
7. **Structured Field Specs**: Ensure `tableFilterProps.formFields` clearly declares field `type`, `name`, `label`, and option `items` for dropdown types using `FieldTypeEnum`.
8. **Typed Export Functions**: Bind `TableExportFnProps` signatures handling `{ fileType: FileTypeOptions }` when enabling exports.
9. **Encapsulated Row Actions**: Leverage `DataTableRowActions` inside action column definitions (`id: 'actions'`) rather than defining inline button clusters to guarantee design system consistency.
10. **Permission-Based Action Guarding**: Pass RBAC props (`canView`, `canEdit`, `canDelete`) directly to `DataTableRowActions` to hide unauthorized operations per user role.
11. **Hybrid Pagination Props**: Always supply both `pagination` (metadata) and `setQueryParams` to enable server-driven table queries. Omit `pagination` only for purely static, local datasets.
12. **Page Index Reset on Size Change**: Ensure backend pagination queries reset to page 1 when changing `pageSize` to avoid requesting invalid page ranges.
13. **Explicit Type Safety**: Always type row generic instances explicitly when consuming `<DataTable<TData> />`, `DataTableRowActionsProps<TData>`, and `DataTablePaginationProps<TData>`.
14. **Localization Enforcement**: Leverage `i18next` key definitions (`t('page')`, `t('of')`, `t('rows_per_page')`, `t('view')`, `t('edit')`, `t('delete')`).

---

## 4. How to Use & Implement

### Step 1: Define Table Configuration & Pagination Models (`src/models/table-model.ts` & `src/models/api.ts`)

::: code-group

```typescript [api.ts]
export interface PaginationMetadata {
  page: number;
  pageSize: number;
  totalRows?: number;
  totalEnabled?: number;
  totalDisabled?: number;
  totalPages: number;
}

export interface ApiSearchParams {
  search?: string;
  page?: number;
  pageSize?: number;
  [key: string]: any;
}
```

```typescript [table-model.ts]
import { ApiSearchParams } from './api';
import { FileTypeOptions } from './export-model';

export enum FieldTypeEnum {
  DROPDOWN = 'dropdown',
  DATE = 'date',
  TEXT = 'text',
  NUMBER = 'number',
}

export type TableExportFnProps = (params: { fileType: FileTypeOptions }) => void;

export interface TableSearchProps {
  placeholder?: string;
  setQueryParams?: (params: ApiSearchParams) => void;
}

export interface FormFieldItem {
  label: string;
  value: string;
}

export interface FormField {
  name: string;
  label: string;
  type: FieldTypeEnum | 'dropdown' | 'date' | 'text' | 'number';
  items?: FormFieldItem[];
}

export interface TableFilterProps {
  setQueryParams: (params: Record<string, any>) => void;
  formDefaultValues?: Record<string, any>;
  resetFilterQueryParams: () => void;
  formFields: FormField[];
}

export interface TableAddProps {
  addButtonLabel?: string;
  addButtonIcon?: React.ComponentType<{ size?: number }>;
  addFunction?: () => void;
}

export interface TableExtraActionButton {
  label?: string;
  pendingLabel?: string;
  icon?: React.ComponentType<{ size?: number; className?: string }>;
  onClick: () => void;
  className?: string;
  isPending?: boolean;
  tooltip?: string;
  variant?: 'default' | 'outline' | 'destructive' | 'ghost' | 'secondary';
}

export interface ToolbarProps {
  tableSearchProps?: TableSearchProps;
  tableAddProps?: TableAddProps;
  tableFilterProps?: TableFilterProps;
  exportFunction?: TableExportFnProps;
  extraAction?: TableExtraActionButton;
}
```

:::

### Step 2: Implement Data Table Pagination (`src/components/shared/data-table/data-table-pagination.tsx`)

::: warning
`pagination` and `setQueryParams` are a pair — pass both together for server-driven tables. Passing `setQueryParams` without `pagination` metadata silently falls back to client-side pagination, which won't match your actual dataset size.
:::

```tsx
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  DoubleArrowLeftIcon,
  DoubleArrowRightIcon,
} from '@radix-ui/react-icons'
import { Table } from '@tanstack/react-table'
import { useTranslation } from 'react-i18next'
import { PaginationMetadata } from '@/models/api'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface DataTablePaginationProps<TData> {
  table: Table<TData>
  queryParams?: Record<string, any>
  setQueryParams?: (params: Record<string, any>) => void
  pagination?: PaginationMetadata
}

export function DataTablePagination<TData>({
  table,
  queryParams,
  setQueryParams,
  pagination,
}: DataTablePaginationProps<TData>) {
  const { t } = useTranslation()
  const isBackendPagination = Boolean(pagination)
  const currentPage = pagination?.page ?? table.getState().pagination.pageIndex + 1
  const totalPages = pagination?.totalPages ?? table.getPageCount()

  const handleNextPage = () => {
    if (isBackendPagination) {
      if (pagination && pagination.page < pagination.totalPages) {
        setQueryParams?.({ ...queryParams, page: pagination.page + 1 })
      }
    } else {
      table.nextPage()
    }
  }

  const handlePreviousPage = () => {
    if (isBackendPagination) {
      if (pagination && pagination.page > 1) {
        setQueryParams?.({ ...queryParams, page: pagination.page - 1 })
      }
    } else {
      table.previousPage()
    }
  }

  const handleFirstPage = () => {
    if (isBackendPagination) {
      setQueryParams?.({ ...queryParams, page: 1 })
    } else {
      table.setPageIndex(0)
    }
  }

  const handleLastPage = () => {
    if (isBackendPagination && pagination) {
      setQueryParams?.({ ...queryParams, page: pagination.totalPages })
    } else {
      table.setPageIndex(table.getPageCount() - 1)
    }
  }

  return (
    <div className="flex items-center justify-between overflow-clip px-5">
      <div className="text-muted-foreground hidden flex-1 text-sm sm:block">
        {t('page')} {currentPage} {t('of')} {totalPages}
      </div>

      <div className="flex items-center sm:space-x-6 lg:space-x-8">
        <div className="flex items-center space-x-2">
          <p className="hidden text-sm font-medium sm:block">{t('rows_per_page')}</p>
          <Select
            value={`${table.getState().pagination.pageSize}`}
            onValueChange={(value) => {
              const size = Number(value)
              table.setPageSize(size)

              if (isBackendPagination) {
                setQueryParams?.({ ...queryParams, pageSize: size, page: 1 })
              }
            }}
          >
            <SelectTrigger className="h-8 w-[70px]">
              <SelectValue placeholder={table.getState().pagination.pageSize} />
            </SelectTrigger>
            <SelectContent side="top">
              {[10, 20, 30, 40, 50].map((pageSize) => (
                <SelectItem key={pageSize} value={`${pageSize}`}>
                  {pageSize}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            className="hidden h-8 w-8 p-0 lg:flex"
            disabled={currentPage === 1}
            onClick={handleFirstPage}
          >
            <span className="sr-only">Go to first page</span>
            <DoubleArrowLeftIcon className="h-4 w-4" />
          </Button>

          <Button
            variant="outline"
            className="h-8 w-8 p-0"
            disabled={currentPage === 1}
            onClick={handlePreviousPage}
          >
            <span className="sr-only">Go to previous page</span>
            <ChevronLeftIcon className="h-4 w-4" />
          </Button>

          <Button
            variant="outline"
            className="h-8 w-8 p-0"
            disabled={currentPage >= totalPages}
            onClick={handleNextPage}
          >
            <span className="sr-only">Go to next page</span>
            <ChevronRightIcon className="h-4 w-4" />
          </Button>

          <Button
            variant="outline"
            className="hidden h-8 w-8 p-0 lg:flex"
            disabled={currentPage >= totalPages}
            onClick={handleLastPage}
          >
            <span className="sr-only">Go to last page</span>
            <DoubleArrowRightIcon className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}

```

### Step 3: Implement Row Actions (`src/components/shared/data-table/data-table-row-actions.tsx`)

```tsx
import { Row } from '@tanstack/react-table'
import {
  IconEdit,
  IconTrash,
  IconEye,
  IconLockOpen,
  IconLock,
  IconHistory,
} from '@tabler/icons-react'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip'

interface DataTableRowActionsProps<TData> {
  row: Row<TData>
  isBlocked?: boolean
  onView?: (data: TData) => void
  onBlock?: (data: TData) => void
  onEdit?: (data: TData) => void
  onCompare?: (data: TData) => void
  onDelete?: (data: TData) => void
  canView?: boolean
  canEdit?: boolean
  canDelete?: boolean
  className?: string
  tooltipMessage?: string
}

export function DataTableRowActions<TData>({
  row,
  isBlocked,
  onView,
  onBlock,
  onEdit,
  onDelete,
  canView = true,
  canEdit = true,
  canDelete = true,
  onCompare,
  className,
  tooltipMessage,
}: DataTableRowActionsProps<TData>) {
  const { t } = useTranslation()
  const buttonClass = 'h-8 w-8 p-0'

  return (
    <div className={cn('flex items-center gap-2', className)}>
      {onBlock && canEdit && (
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              size="sm"
              variant="outline"
              onClick={() => onBlock?.(row.original)}
              className={cn(
                buttonClass,
                isBlocked
                  ? 'text-green-500 hover:border-green-300 hover:text-green-600'
                  : 'text-amber-500 hover:border-amber-300 hover:text-amber-600'
              )}
            >
              {isBlocked ? <IconLockOpen size={16} /> : <IconLock size={16} />}
            </Button>
          </TooltipTrigger>
          <TooltipContent
            colorClass={cn(isBlocked ? 'bg-green-500 text-white' : 'bg-amber-500 text-white')}
            arrowClass={cn(isBlocked ? 'fill-green-500' : 'fill-amber-500')}
          >
            {tooltipMessage}
          </TooltipContent>
        </Tooltip>
      )}

      {onView && canView && (
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              size="sm"
              variant="outline"
              onClick={() => onView?.(row.original)}
              className={cn(buttonClass, 'text-blue-500 hover:border-blue-300 hover:text-blue-600')}
            >
              <IconEye size={16} />
            </Button>
          </TooltipTrigger>
          <TooltipContent arrowClass="bg-blue-500 fill-blue-500" colorClass="bg-blue-500 text-white">
            {t('view')}
          </TooltipContent>
        </Tooltip>
      )}

      {onEdit && canEdit && (
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              size="sm"
              variant="outline"
              onClick={() => onEdit?.(row.original)}
              className={cn(buttonClass, 'text-green-500 hover:border-green-300 hover:text-green-600')}
            >
              <IconEdit size={16} />
            </Button>
          </TooltipTrigger>
          <TooltipContent arrowClass="bg-green-500 fill-green-500" colorClass="bg-green-500 text-white">
            {t('edit')}
          </TooltipContent>
        </Tooltip>
      )}

      {onCompare && canView && (
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              size="sm"
              variant="outline"
              onClick={() => onCompare?.(row.original)}
              className={cn(buttonClass, 'text-blue-500 hover:border-blue-300 hover:text-blue-600')}
            >
              <IconHistory size={16} />
            </Button>
          </TooltipTrigger>
          <TooltipContent arrowClass="bg-blue-500 fill-blue-500" colorClass="bg-blue-500 text-white">
            {t('audit')}
          </TooltipContent>
        </Tooltip>
      )}

      {onDelete && canDelete && (
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              size="sm"
              variant="outline"
              onClick={() => onDelete?.(row.original)}
              className={cn(buttonClass, 'text-destructive hover:border-red-300 hover:text-red-600')}
            >
              <IconTrash size={16} />
            </Button>
          </TooltipTrigger>
          <TooltipContent arrowClass="bg-destructive fill-destructive" colorClass="bg-destructive text-white">
            {t('delete')}
          </TooltipContent>
        </Tooltip>
      )}
    </div>
  )
}

```

### Step 4: Implement Data Table Search (`src/components/shared/data-table/data-table-search.tsx`)

```tsx
import { useEffect, useState } from "react";
import { Search } from "lucide-react";
import { TableSearchProps } from "@/models/table-model";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import { useDebounce } from "@/hooks/use-debounce";

interface DataTableSearchProps {
  tableSearchProps?: TableSearchProps;
}

const DataTableSearch = ({ tableSearchProps }: DataTableSearchProps) => {
  const [searchTerm, setSearchTerm] = useState<string>("");
  const debouncedSearchTerm = useDebounce(searchTerm, 150) || "";

  useEffect(() => {
    if (tableSearchProps?.setQueryParams) {
      tableSearchProps.setQueryParams({
        search: debouncedSearchTerm,
        page: 1,
      });
    }
  }, [debouncedSearchTerm, tableSearchProps?.setQueryParams]);

  return (
    <InputGroup className="h-9 w-[150px] lg:w-[200px]">
      <InputGroupInput
        placeholder={tableSearchProps?.placeholder || "Search..."}
        onChange={(e) => setSearchTerm(e.target.value)}
      />
      <InputGroupAddon>
        <Search />
      </InputGroupAddon>
    </InputGroup>
  );
};

export default DataTableSearch;

```

### Step 5: Implement Data Table Filter Popover (`src/components/shared/data-table/data-table-filter.tsx`)

```tsx
import React from 'react'
import { format } from 'date-fns'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { IconFilter } from '@tabler/icons-react'
import { TableFilterProps } from '@/models/table-model'
import { Button } from '@/components/ui/button'
import { DateTimePicker } from '@/components/ui/datetime-picker'
import { Form, FormControl, FormField, FormItem, FormLabel } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Separator } from '@/components/ui/separator'
import { SelectDropdown } from '@/components/select-dropdown'

interface DataTableFilterProps {
  tableFilterProps: TableFilterProps
}

export function DataTableFilter({ tableFilterProps }: DataTableFilterProps) {
  const { t } = useTranslation()
  const { setQueryParams, resetFilterQueryParams } = tableFilterProps
  const [open, setOpen] = React.useState(false)

  const getTodayFormatted = () => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    return format(today, 'yyyy-MM-dd HH:mm:ss')
  }

  const getDefaultValues = () => {
    const defaults = { ...tableFilterProps.formDefaultValues }

    tableFilterProps.formFields?.forEach((field) => {
      if (field.type === 'date' && !defaults[field.name]) {
        if (field.name.toLowerCase() === 'to' || field.name.toLowerCase().includes('end')) {
          const today = new Date()
          today.setHours(23, 59, 59, 0)
          defaults[field.name] = format(today, 'yyyy-MM-dd HH:mm:ss')
        } else {
          defaults[field.name] = getTodayFormatted()
        }
      }
    })

    return defaults
  }

  const form = useForm({ defaultValues: getDefaultValues() })
  const startDate = form.watch('start')
  const endDate = form.watch('end')

  function handleDateChange(field: any, date: Date | undefined) {
    if (!date) {
      field.onChange('')
      return
    }
    field.onChange(format(date, 'yyyy-MM-dd HH:mm:ss'))
  }

  function onSubmit(values: any) {
    const payload = { ...values }
    if (payload.status === 'all') payload.status = ''
    setQueryParams(payload)
    setOpen(false)
  }

  function onCancel() {
    form.reset()
    resetFilterQueryParams()
    setOpen(false)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          size="sm"
          variant="outline"
          className="ml-auto hidden h-9 lg:flex hover:bg-primary hover:text-primary-foreground dark:hover:bg-primary/90"
        >
          <IconFilter className="mr-2 h-4 w-4" />
          {t('filter')}
        </Button>
      </PopoverTrigger>

      <PopoverContent align="end" className="w-80">
        <div className="grid gap-4 space-y-2">
          <div className="space-y-2">
            <h4 className="font-medium leading-none">{t('filter_options')}</h4>
            <Separator className="mt-4" />
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid gap-2">
                {tableFilterProps.formFields?.map((field) => (
                  <FormField
                    key={field.name}
                    control={form.control}
                    name={field.name}
                    render={({ field: formField }) => (
                      <div className="grid grid-cols-3 items-center gap-4">
                        <FormLabel className="col-span-1">{field.label}</FormLabel>
                        <FormItem className="col-span-2">
                          {field.type === 'dropdown' && (
                            <SelectDropdown
                              defaultValue={formField.value}
                              onValueChange={formField.onChange}
                              items={field.items || []}
                              placeholder={`${t('select')} ${field.label.toLowerCase()}`}
                              className="w-full"
                            />
                          )}
                          {field.type === 'date' && (
                            <DateTimePicker
                              value={formField.value ? new Date(formField.value) : undefined}
                              onChange={(date) => handleDateChange(formField, date)}
                              granularity="minute"
                              displayFormat={{ hour24: 'yyyy-MM-dd HH:mm:ss' }}
                              minDate={field.name === 'end' && startDate ? new Date(startDate) : undefined}
                              maxDate={field.name === 'start' && endDate ? new Date(endDate) : undefined}
                            />
                          )}
                          {field.type === 'text' && (
                            <FormControl>
                              <Input
                                placeholder={field.label}
                                value={formField.value}
                                onChange={formField.onChange}
                              />
                            </FormControl>
                          )}
                          {field.type === 'number' && (
                            <FormControl>
                              <Input
                                type="number"
                                value={formField.value}
                                onChange={(e) => formField.onChange(e.target.value)}
                                placeholder={field.label}
                              />
                            </FormControl>
                          )}
                        </FormItem>
                      </div>
                    )}
                  />
                ))}
              </div>

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={onCancel}>
                  {t('reset_button')}
                </Button>
                <Button type="submit">{t('apply')}</Button>
              </div>
            </form>
          </Form>
        </div>
      </PopoverContent>
    </Popover>
  )
}

```

### Step 6: Implement Export Action Component (`src/components/shared/data-table/data-table-export.tsx`)

```tsx
import { useTranslation } from "react-i18next";
import { IconFileTypePdf, IconFileTypeXls, IconUpload } from "@tabler/icons-react";
import { FileTypeOptions } from "@/models/export-model";
import { TableExportFnProps } from "@/models/table-model";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface DataTableExportProps {
  exportFn: TableExportFnProps;
}

export function DataTableExport({ exportFn }: DataTableExportProps) {
  const { t } = useTranslation();

  return (
    <div className="flex gap-2">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            size="sm"
            variant="outline"
            className="ml-auto hidden h-9 lg:flex hover:bg-primary hover:text-primary-foreground dark:hover:bg-primary/90"
          >
            <IconUpload className="mr-2 h-4 w-4" size={18} />
            <span>{t("export")}</span>
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => exportFn({ fileType: FileTypeOptions.PDF })}>
            <IconFileTypePdf className="mr-2 h-4 w-4 text-red-500" />
            <span>{t("pdf")}</span>
          </DropdownMenuItem>

          <DropdownMenuItem onClick={() => exportFn({ fileType: FileTypeOptions.EXCEL })}>
            <IconFileTypeXls className="mr-2 h-4 w-4 text-green-600" />
            <span>{t("excel")}</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

```

### Step 7: Implement Extra Action Component (`src/components/shared/data-table/data-table-extra.tsx`)

```tsx
import React from "react";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/shadcn-io/spinner";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { TableExtraActionButton } from "@/models/table-model";

interface DataTableExtraActionProps {
  tableExtraActionProps: TableExtraActionButton;
}

export const DataTableExtra: React.FC<DataTableExtraActionProps> = ({ tableExtraActionProps }) => {
  const Icon = tableExtraActionProps.icon;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          size="sm"
          variant={tableExtraActionProps.variant}
          className={tableExtraActionProps.className}
          disabled={tableExtraActionProps.isPending}
          onClick={tableExtraActionProps.onClick}
        >
          {tableExtraActionProps.isPending ? (
            <>
              <Spinner variant="circle" />
              <span>{tableExtraActionProps.pendingLabel}</span>
            </>
          ) : (
            <>
              {Icon && <Icon size={10} />}
              <span>{tableExtraActionProps.label}</span>
            </>
          )}
        </Button>
      </TooltipTrigger>
      <TooltipContent>{tableExtraActionProps.tooltip}</TooltipContent>
    </Tooltip>
  );
};

export default DataTableExtra;

```

### Step 8: Implement Add Button Component (`src/components/shared/data-table/data-table-add.tsx`)

```tsx
import React from "react";
import { IconPlus } from "@tabler/icons-react";
import { TableAddProps } from "@/models/table-model";
import { Button } from "@/components/ui/button";

interface DataTableAddProps {
  tableAddProps: TableAddProps;
}

export const DataTableAdd: React.FC<DataTableAddProps> = ({ tableAddProps }) => {
  return (
    <Button
      size="sm"
      variant="custom"
      className="ml-auto hidden h-9 lg:flex"
      onClick={tableAddProps.addFunction}
    >
      <IconPlus size={10} />
      <span>{tableAddProps.addButtonLabel}</span>
    </Button>
  );
};

export default DataTableAdd;

```

### Step 9: Implement Table Toolbar Component (`src/components/shared/data-table/data-table-toolbar.tsx`)

```tsx
import { Table } from "@tanstack/react-table";
import { ToolbarProps } from "@/models/table-model";
import DataTableAdd from "./data-table-add";
import DataTableExtra from "./data-table-extra";
import { DataTableExport } from "./data-table-export";
import { DataTableFilter } from "./data-table-filter";
import DataTableSearch from "./data-table-search";
import { DataTableViewOptions } from "./data-table-view-options";

interface DataTableToolbarProps<TData> {
  table: Table<TData>;
  toolbarProps?: ToolbarProps;
}

export function DataTableToolbar<TData>({ table, toolbarProps }: DataTableToolbarProps<TData>) {
  return (
    <div className="flex items-center justify-between p-4">
      <div className="flex flex-1 flex-col-reverse items-start gap-y-2 sm:flex-row sm:items-center sm:space-x-2">
        {toolbarProps?.tableSearchProps && (
          <DataTableSearch tableSearchProps={toolbarProps.tableSearchProps} />
        )}
        <DataTableViewOptions table={table} />
      </div>

      <div className="flex gap-2">
        {toolbarProps?.extraAction && (
          <DataTableExtra tableExtraActionProps={toolbarProps.extraAction} />
        )}

        {toolbarProps?.exportFunction && (
          <DataTableExport exportFn={toolbarProps.exportFunction} />
        )}

        {toolbarProps?.tableFilterProps && (
          <DataTableFilter tableFilterProps={toolbarProps.tableFilterProps} />
        )}

        {toolbarProps?.tableAddProps && (
          <DataTableAdd tableAddProps={toolbarProps.tableAddProps} />
        )}
      </div>
    </div>
  );
}

```

### Step 10: Implement Reusable Table Shell (`src/components/shared/data-table/data-table.tsx`)

```tsx
import { useState } from 'react'
import {
  ColumnDef,
  ColumnFiltersState,
  RowData,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table'
import { useTranslation } from 'react-i18next'
import { Card } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { PaginationMetadata } from '@/models/api'
import { ToolbarProps } from '@/models/table-model'
import DataTableLoading from './data-table-loading'
import { DataTablePagination } from './data-table-pagination'
import { DataTableToolbar } from './data-table-toolbar'

interface DataTableProps<TData extends RowData> {
  columns: ColumnDef<TData>[]
  data: TData[]
  toolbarProps?: ToolbarProps
  isLoading?: boolean
  queryParams?: Record<string, any>
  setQueryParams?: (params: Record<string, any>) => void
  pagination?: PaginationMetadata
}

export function DataTable<TData extends RowData>({
  columns,
  data,
  toolbarProps,
  isLoading,
  queryParams,
  setQueryParams,
  pagination,
}: DataTableProps<TData>) {
  const { t } = useTranslation()

  const [rowSelection, setRowSelection] = useState({})
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [sorting, setSorting] = useState<SortingState>([])

  const table = useReactTable({
    data,
    columns,
    state: { sorting, columnVisibility, rowSelection, columnFilters },
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
  })

  return (
    <div className="space-y-4">
      <div className="rounded-md">
        <Card paddingY="pb-4">
          <DataTableToolbar table={table} toolbarProps={toolbarProps} />
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id} className="group/row">
                  {headerGroup.headers.map((header) => (
                    <TableHead
                      key={header.id}
                      colSpan={header.colSpan}
                      className={header.column.columnDef.meta?.className}
                    >
                      {header.isPlaceholder
                        ? null
                        : flexRender(header.column.columnDef.header, header.getContext())}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={columns.length} className="h-24 text-center">
                    <DataTableLoading />
                  </TableCell>
                </TableRow>
              ) : table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow
                    key={row.id}
                    data-state={row.getIsSelected() && 'selected'}
                    className="group/row"
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id} className={cell.column.columnDef.meta?.className}>
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={columns.length} className="h-24 text-center">
                    {t('no_results_found')}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
          <DataTablePagination
            table={table}
            queryParams={queryParams}
            setQueryParams={setQueryParams}
            pagination={pagination}
          />
        </Card>
      </div>
    </div>
  )
}

```

---

## 5. Production Template Example (`src/apps/users`)

This complete real-world implementation demonstrates store integration (`useUsersStore`), custom toolbar hooks (`useUserToolbarProps`), hook-driven column definitions (`useUserColumns`), RBAC guards, and the core page view (`Users`).

### Step 5.1: Defining Column Rules (`src/apps/users/table/users-columns.tsx`)

```tsx
import { useMemo } from 'react'
import { ColumnDef } from '@tanstack/react-table'
import { DialogEnum } from '@/models/alert-model'
import { User, UserRole } from '@/models/user-model'
import {
  IconCash,
  IconShield,
  IconUser,
  IconUsers,
  IconUserShield,
} from '@tabler/icons-react'
import { BanIcon, CheckCircleIcon } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useUsersStore } from '@/stores/users-store'
import { cn } from '@/lib/utils'
import { usePermissions } from '@/hooks/use-permissions'
import { Badge } from '@/components/ui/badge'
import { LongText } from '@/components/long-text'
import { DataTableColumnHeader, DataTableRowActions } from '@/components/shared/data-table'

export const useUserColumns = (): ColumnDef<User>[] => {
  const { t } = useTranslation()
  const { setOpen, setCurrentUserId } = useUsersStore()
  const { modulePermissions } = usePermissions()

  const userTypes: { label: string; value: UserRole; icon: any }[] = [
    { label: 'super_admin', value: UserRole.SUPER_ADMIN, icon: IconShield },
    { label: 'admin', value: UserRole.ADMIN, icon: IconUserShield },
    { label: 'manager', value: UserRole.MANAGER, icon: IconUsers },
    { label: 'cashier', value: UserRole.CASHIER, icon: IconCash },
    { label: 'user', value: UserRole.USER, icon: IconUser },
  ]

  return useMemo<ColumnDef<User>[]>(
    () => [
      {
        accessorKey: 'first_name',
        header: ({ column }) => <DataTableColumnHeader column={column} title={t('first_name')} />,
        cell: ({ row }) => <LongText className="max-w-36">{row.original.first_name}</LongText>,
        meta: { className: cn('sticky left-4 md:table-cell') },
        enableHiding: false,
      },
      {
        accessorKey: 'last_name',
        header: ({ column }) => <DataTableColumnHeader column={column} title={t('last_name')} />,
        cell: ({ row }) => <LongText className="max-w-36">{row.original.last_name}</LongText>,
      },
      {
        accessorKey: 'email',
        header: ({ column }) => <DataTableColumnHeader column={column} title={t('email')} />,
        cell: ({ row }) => <div className="w-fit text-nowrap">{row.original.email}</div>,
      },
      {
        accessorKey: 'role_name',
        header: ({ column }) => <DataTableColumnHeader column={column} title={t('role')} />,
        cell: ({ row }) => {
          const role = row.original.role_name
          const userType = userTypes.find((u) => u.value === role.toLowerCase())

          return (
            <div className="flex items-center gap-x-2">
              {userType?.icon && <userType.icon size={16} className="text-muted-foreground" />}
              <span className="text-sm capitalize">{role}</span>
            </div>
          )
        },
        filterFn: (row, id, value) => value.includes(row.original.role_name),
        enableSorting: true,
        enableHiding: true,
      },
      {
        accessorKey: 'status',
        header: ({ column }) => <DataTableColumnHeader column={column} title={t('status')} />,
        cell: ({ row }) => {
          const isActive = row.original.status
          const badgeVariant = isActive ? 'success' : 'destructive'
          const icon = isActive ? (
            <CheckCircleIcon className="size-3" />
          ) : (
            <BanIcon className="size-3" />
          )
          return (
            <div className="flex items-center space-x-2">
              <Badge variant={badgeVariant} className="capitalize">
                {icon}
                {row.original.status ? t('enabled') : t('disabled')}
              </Badge>
            </div>
          )
        },
        sortingFn: (rowA, rowB) => {
          const b = rowA.original.status ? 1 : 0
          const a = rowB.original.status ? 1 : 0
          return a - b
        },
        enableSorting: true,
        enableHiding: true,
      },
      {
        accessorKey: 'updated_at',
        header: ({ column }) => <DataTableColumnHeader column={column} title={t('updated_at')} />,
        cell: ({ row }) => (
          <Badge variant="secondary" className="max-w-38 text-xs">
            <LongText>{row.original.updated_at}</LongText>
          </Badge>
        ),
      },
      {
        id: 'actions',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title={t('actions')} className="mr-4 flex justify-end" />
        ),
        cell: ({ row }) => {
          const isSuperAdmin = row.original.user_id === 1
          const isBlocked = !row.original.status
          const tooltipMessage = isBlocked ? t('activate_user') : t('deactivate_user')

          return (
            <DataTableRowActions
              row={row}
              isBlocked={isBlocked}
              tooltipMessage={tooltipMessage}
              className="mr-4 justify-end"
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
          )
        },
        enableSorting: false,
        enableHiding: false,
      },
    ],
    [t, setOpen, setCurrentUserId, modulePermissions]
  )
}

```

### Step 5.2: Configuring Dynamic Toolbar Props (`src/apps/users/table/data.ts`)

```typescript
import { IconUserPlus } from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import { UserStatusTypes } from "@/models/user-model";
import { DialogEnum } from "@/models/alert-model";
import { exportUsers } from "@/service/users";
import { FileType } from "@/models/export-model";
import { FieldTypeEnum } from "@/models/table-model";
import { usePermissions } from "@/hooks/use-permissions";
import { useUsersStore } from "@/stores/users-store";
import { useRoles } from "@/hooks/use-roles";

export const callTypes = Object.values(UserStatusTypes);

export const useUserToolbarProps = () => {
  const { t } = useTranslation();
  const { setOpen, queryParams, setQueryParams, resetFilterQueryParams } = useUsersStore();
  const { modulePermissions } = usePermissions();
  const canCreateUser = modulePermissions.users?.canCreate;
  const { data: rolesData } = useRoles();

  const roleItems = [
    { label: t("all"), value: "all" },
    ...(rolesData?.map((role) => ({ label: role.role_name, value: role.role_name })) || []),
  ];

  return {
    tableSearchProps: {
      placeholder: t("search_users"),
      setQueryParams,
    },
    tableAddProps: canCreateUser
      ? {
          addButtonLabel: t("add_user"),
          addButtonIcon: IconUserPlus,
          addFunction: () => setOpen(DialogEnum.ADD),
        }
      : undefined,
    tableFilterProps: {
      setQueryParams,
      resetFilterQueryParams,
      formDefaultValues: {
        status: "all",
      },
      formFields: [
        {
          name: "status",
          label: t("status"),
          type: FieldTypeEnum.DROPDOWN,
          items: [
            { label: t("all"), value: "all" },
            { label: t("active"), value: "true" },
            { label: t("inactive"), value: "false" },
          ],
        },
        {
          name: "role_name",
          label: t("role"),
          type: FieldTypeEnum.DROPDOWN,
          items: roleItems,
        },
      ],
    },
    exportFunction: (props: { fileType: FileType }) => exportUsers(props.fileType, queryParams),
  };
};

```

### Step 5.3: Assembling Table View Component (`src/apps/users/index.tsx`)

```tsx
import { useMemo } from 'react'
import {
  IconInfoCircle,
  IconUserCheck,
  IconUsers,
  IconUsersGroup,
  IconUserX,
} from '@tabler/icons-react'
import { useTranslation } from 'react-i18next'
import { useUsersStore } from '@/stores/users-store'
import { useUsers } from '@/hooks/use-users'
import { Card } from '@/components/ui/card'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { Main } from '@/components/layout/main'
import { DataTable } from '@/components/shared/data-table'
import { useUserToolbarProps } from './table/data'
import { useUserColumns } from './table/users-columns'
import { UsersModals } from './users-modal'

export function Users() {
  const { t } = useTranslation()
  const { queryParams, setQueryParams } = useUsersStore()
  const { data: usersResponse, isLoading } = useUsers(queryParams)
  const data = useMemo(() => usersResponse?.data ?? [], [usersResponse?.data])
  const pagination = useMemo(() => usersResponse?.pagination ?? undefined, [usersResponse?.pagination])
  const toolbarProps = useUserToolbarProps()
  const columns = useUserColumns()
  const totalUsers = pagination?.totalRows ?? 0
  const enabledUsers = pagination?.totalEnabled ?? 0
  const disabledUsers = pagination?.totalDisabled ?? 0

  return (
    <>
      <Main>
        <div className="mb-2 flex flex-wrap items-center space-x-2">
          <div className="bg-primary text-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
            <IconUsers className="size-5" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight">{t('user_management')}</h2>
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="bg-card text-card-foreground gap-0 rounded-xl border p-0 shadow-sm">
            <div className="flex flex-row items-center justify-between space-y-0 p-6 pt-4 pb-2">
              <div className="flex items-center gap-2 text-sm font-medium tracking-tight">
                <IconUsersGroup className="size-5" />
                {t('total_users')}
              </div>
              <Tooltip>
                <TooltipTrigger asChild>
                  <IconInfoCircle size={24} strokeWidth={1.25} className="text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent>{t('total_users_tooltip')}</TooltipContent>
              </Tooltip>
            </div>
            <div className="p-6 pt-0 pb-4">
              <div className="text-2xl font-bold">{totalUsers}</div>
            </div>
          </Card>

          <Card className="bg-card text-card-foreground gap-0 rounded-xl border p-0 shadow-sm">
            <div className="flex flex-row items-center justify-between space-y-0 p-6 pt-4 pb-2">
              <div className="flex items-center gap-2 text-sm font-medium tracking-tight">
                <IconUserCheck className="size-5" />
                {t('enabled_users')}
              </div>
              <Tooltip>
                <TooltipTrigger asChild>
                  <IconInfoCircle size={24} strokeWidth={1.25} className="text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent>{t('enabled_users_tooltip')}</TooltipContent>
              </Tooltip>
            </div>
            <div className="p-6 pt-0 pb-4">
              <div className="text-2xl font-bold">{enabledUsers}</div>
            </div>
          </Card>

          <Card className="bg-card text-card-foreground gap-0 rounded-xl border p-0 shadow-sm">
            <div className="flex flex-row items-center justify-between space-y-0 p-6 pt-4 pb-2">
              <div className="flex items-center gap-2 text-sm font-medium tracking-tight">
                <IconUserX className="size-5" />
                {t('disabled_users')}
              </div>
              <Tooltip>
                <TooltipTrigger asChild>
                  <IconInfoCircle size={24} strokeWidth={1.25} className="text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent>{t('disabled_users_tooltip')}</TooltipContent>
              </Tooltip>
            </div>
            <div className="p-6 pt-0 pb-4">
              <div className="text-2xl font-bold">{disabledUsers}</div>
            </div>
          </Card>
        </div>

        <div className="-mx-4 mt-4 flex-1 overflow-auto px-4 py-1 lg:flex-row lg:space-y-0 lg:space-x-12">
          <DataTable
            data={data}
            columns={columns}
            toolbarProps={toolbarProps}
            isLoading={isLoading}
            queryParams={queryParams}
            setQueryParams={setQueryParams}
            pagination={pagination}
          />
        </div>
      </Main>
      <UsersModals />
    </>
  )
}

```

---

## 6. Common Mistakes to Avoid

* ❌ **Missing Pagination Reset on Page-Size Change**: Changing `pageSize` without resetting `page: 1` causes API requests to fetch non-existent target page offsets.
* ❌ **Omitting Backend Pagination Metadata**: Forgetting to pass the `pagination` metadata object defaults the component into pure client-side mode, breaking remote API pagination synchronization.
* ❌ **Direct Inline Column Definitions**: Declaring columns as standard objects outside custom hooks prevents dynamic localization (`t(...)`) and permission re-evaluations.
* ❌ **Inline Action Buttons**: Defining raw action button clusters inside column `cell` definitions instead of consuming `DataTableRowActions`.
* ❌ **Unbound Row Callbacks**: Forgetting to pass `row.original` inside handlers, causing scope target losses on action dispatches.
* ❌ **Missing `pendingLabel`**: Omitting `pendingLabel` while `isPending` is active results in empty text alongside the spinner.
* ❌ **Missing `setQueryParams` in `tableSearchProps`**: Forgetting to pass the callback handler into search props breaks live debounced query updates.
* ❌ **Unformatted Date Payloads**: Returning raw Date objects instead of standardized ISO string dates (`yyyy-MM-dd HH:mm:ss`).
* ❌ **Untyped Export Callbacks**: Passing raw string flags instead of utilizing standard `FileTypeOptions` or `FileType` enum keys.
* ❌ **Bypassing Generic Definitions**: Rendering `<DataTable />` without explicit generic model types risks type inference degradation across cell actions.