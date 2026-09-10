# Dynamic Data Table Architecture

This guide details the reusable application-wide dynamic data table architecture built on top of `@tanstack/react-table`. Each component is broken down into its specific purpose, prop specifications, rules, and implementation details.

---

## 1. System Overview & Architecture Flow

The data table system wraps `@tanstack/react-table` to standardise layout cards, dynamic toolbars, search debouncing, custom filters, row action bars, and dual-mode (client/server) pagination.


```
               [ Parent View / Page ]
                         │
        ┌────────────────┴────────────────┐
        ▼                                 ▼

[ Column Definitions ]           [ Data & Pagination ]
│                                 │
(Includes DataTableRowActions)              │
│                                 │
└────────────────┬────────────────┘
│
▼
[ DataTable Component ]
│
┌─────────────────────┼─────────────────────┐
▼                     ▼                     ▼
[ Toolbar Component ]   [ Table Container ]  [ Pagination Component ]
(Search/Filter/Add/     (Headers, Rows,      (Page Size Select,
Export/Extra Actions)   Loading, Empty)      Page Jump, Dual Mode
Backend/Client Sync)

```

---

## 2. Core Data Models (`src/models/table-model.ts` & `src/models/api.ts`)

These TypeScript contracts define the props across all data table sub-components.

```typescript
// src/models/api.ts
export interface PaginationMetadata {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
}

export interface ApiSearchParams {
  search?: string;
  page?: number;
  pageSize?: number;
  [key: string]: any;
}

// src/models/table-model.ts
import { ApiSearchParams } from './api';
import { FileTypeOptions } from './export-model';

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
  type: 'dropdown' | 'date' | 'text' | 'number';
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

---

## 3. Main Container (`DataTable`)

* **File Location**: `src/components/shared/data-table/data-table.tsx`
* **Purpose**: Serves as the high-level shell mounting the `DataTableToolbar`, main HTML `Table` element, loading/empty states, and `DataTablePagination`.

### Implementation

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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { PaginationMetadata } from '@/models/api'
import { ToolbarProps } from '@/models/table-model'
import DataTableLoading from './data-table-loading'
import { DataTablePagination } from './data-table-pagination'
import { DataTableToolbar } from './data-table-toolbar'

interface DataTableProps<TData RowData extends> {
  columns: ColumnDef<TData>[]
  data: TData[]
  toolbarProps?: ToolbarProps
  isLoading?: boolean
  queryParams?: Record<string, any>
  setQueryParams?: (params: Record<string, any>) => void
  pagination?: PaginationMetadata
}

export function DataTable<TData RowData extends>({
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
    state: {
      sorting,
      columnVisibility,
      rowSelection,
      columnFilters,
    },
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
          <DataTableToolbar table="{table}" toolbarProps="{toolbarProps}"/>
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow className="group/row" key="{headerGroup.id}">
                  {headerGroup.headers.map((header) => (
                    <TableHead className="{header.column.columnDef.meta?.className}" colSpan="{header.colSpan}" key="{header.id}">
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell className="h-24 text-center" colSpan="{columns.length}">
                    <DataTableLoading/>
                  </TableCell>
                </TableRow>
              ) : table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow && 'selected'} className="group/row" data-state="{row.getIsSelected()" key="{row.id}">
                    {row.getVisibleCells().map((cell) => (
                      <TableCell className="{cell.column.columnDef.meta?.className}" key="{cell.id}">
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell className="h-24 text-center" colSpan="{columns.length}">
                    {t('no_results_found')}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
          <DataTablePagination pagination="{pagination}" queryParams="{queryParams}" setQueryParams="{setQueryParams}" table="{table}"/>
        </Card>
      </div>
    </div>
  )
}

```

---

## 4. Toolbar Component (`DataTableToolbar`)

* **File Location**: `src/components/shared/data-table/data-table-toolbar.tsx`
* **Purpose**: Positions search, view options, extra actions, export buttons, filter popovers, and add controls across a responsive header bar.

### Implementation

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

export function DataTableToolbar<TData>({
  table,
  toolbarProps,
}: DataTableToolbarProps<TData>) {
  return (
    <div className="flex items-center justify-between p-4">
      <div className="flex flex-1 flex-col-reverse items-start gap-y-2 sm:flex-row sm:items-center sm:space-x-2">
        {toolbarProps?.tableSearchProps && (
          <DataTableSearch tableSearchProps="{toolbarProps.tableSearchProps}"/>
        )}
        <DataTableViewOptions table="{table}"/>
      </div>

      <div className="flex gap-2">
        {toolbarProps?.extraAction && (
          <DataTableExtra tableExtraActionProps="{toolbarProps.extraAction}"/>
        )}

        {toolbarProps?.exportFunction && (
          <DataTableExport exportFn="{toolbarProps.exportFunction}"/>
        )}

        {toolbarProps?.tableFilterProps && (
          <DataTableFilter tableFilterProps="{toolbarProps.tableFilterProps}"/>
        )}

        {toolbarProps?.tableAddProps && (
          <DataTableAdd tableAddProps="{toolbarProps.tableAddProps}"/>
        )}
      </div>
    </div>
  );
}

```

---

## 5. Search Control Component (`DataTableSearch`)

* **File Location**: `src/components/shared/data-table/data-table-search.tsx`
* **Purpose**: Handles user text inputs, applies a 150ms debounce delay, and dispatches API query updates (`page: 1`) via `setQueryParams`.

### Implementation

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
        page: 1 
      });
    }
  }, [debouncedSearchTerm, tableSearchProps?.setQueryParams]);

  return (
    <InputGroup className="h-9 w-[150px] lg:w-[200px]">
      <InputGroupInput "Search..."} onChange="{(e)" placeholder="{tableSearchProps?.placeholder" ||> setSearchTerm(e.target.value)}
      />
      <InputGroupAddon>
        <Search/>
      </InputGroupAddon>
    </InputGroup>
  );
};

export default DataTableSearch;

```

---

## 6. Filter Popover Component (`DataTableFilter`)

* **File Location**: `src/components/shared/data-table/data-table-filter.tsx`
* **Purpose**: Dynamically renders field forms (dropdowns, date-time pickers, text, numbers) inside a popover panel and emits formatted ISO parameters.

### Implementation

```tsx
import React from 'react'
import { format } from 'date-fns'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { IconFilter } from '@tabler/icons-react'
import { TableFilterProps } from '@/models/table-model'
import { Button } from '@/components/ui/button'
import { DateTimePicker } from '@/components/ui/datetime-picker'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
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
        if (
          field.name.toLowerCase() === 'to' ||
          field.name.toLowerCase().includes('end')
        ) {
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
    <Popover onOpenChange="{setOpen}" open="{open}">
      <PopoverTrigger asChild>
        <Button className="ml-auto hidden h-9 lg:flex hover:bg-primary hover:text-primary-foreground dark:hover:bg-primary/90" size="sm" variant="outline">
          <IconFilter className="mr-2 h-4 w-4"/>
          {t('filter')}
        </Button>
      </PopoverTrigger>

      <PopoverContent align="end" className="w-80">
        <div className="grid gap-4 space-y-2">
          <div className="space-y-2">
            <h4 className="font-medium leading-none">{t('filter_options')}</h4>
            <Separator className="mt-4"/>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid gap-2">
                {tableFilterProps.formFields?.map((field) => (
                  <FormField control="{form.control}" field: formField key="{field.name}" name="{field.name}" render="{({"> (
                      <div className="grid grid-cols-3 items-center gap-4">
                        <FormLabel className="col-span-1">{field.label}</FormLabel>
                        <FormItem className="col-span-2">
                          {field.type === 'dropdown' && (
                            <SelectDropdown ${field.label.toLowerCase()}`} []} className="w-full" defaultValue="{formField.value}" items="{field.items" onValueChange="{formField.onChange}" placeholder="{`${t('select')}" ||/>
                          )}
                          {field.type === 'date' && (
                            <DateTimePicker : ? Date(formField.value) new onChange="{(date)" undefined} value="{formField.value"> handleDateChange(formField, date)}
                              granularity="minute"
                              displayFormat={{ hour24: 'yyyy-MM-dd HH:mm:ss' }}
                              minDate={field.name === 'end' && startDate ? new Date(startDate) : undefined}
                              maxDate={field.name === 'start' && endDate ? new Date(endDate) : undefined}
                            />
                          )}
                          {field.type === 'text' && (
                            <FormControl>
                              <Input onChange="{formField.onChange}" placeholder="{field.label}" value="{formField.value}"/>
                            </FormControl>
                          )}
                          {field.type === 'number' && (
                            <FormControl>
                              <Input onChange="{(e)" placeholder="{field.label}" type="number" value="{formField.value}"> formField.onChange(e.target.value)}
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
                <Button onClick="{onCancel}" type="button" variant="outline">
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

---

## 7. Export Menu Component (`DataTableExport`)

* **File Location**: `src/components/shared/data-table/data-table-export.tsx`
* **Purpose**: Provides a dropdown menu to trigger PDF or Excel data exports.

### Implementation

```tsx
import { useTranslation } from "react-i18next";
import {
  IconFileTypePdf,
  IconFileTypeXls,
  IconUpload,
} from "@tabler/icons-react";
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
          <Button className="ml-auto hidden h-9 lg:flex hover:bg-primary hover:text-primary-foreground dark:hover:bg-primary/90" size="sm" variant="outline">
            <IconUpload className="mr-2 h-4 w-4" size="{18}"/>
            <span>{t("export")}</span>
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick="{()"> exportFn({ fileType: FileTypeOptions.PDF })}
          >
            <IconFileTypePdf className="mr-2 h-4 w-4 text-red-500"/>
            <span>{t("pdf")}</span>
          </DropdownMenuItem>

          <DropdownMenuItem onClick="{()"> exportFn({ fileType: FileTypeOptions.EXCEL })}
          >
            <IconFileTypeXls className="mr-2 h-4 w-4 text-green-600"/>
            <span>{t("excel")}</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

```

---

## 8. Extra Action Component (`DataTableExtra`)

* **File Location**: `src/components/shared/data-table/data-table-extra.tsx`
* **Purpose**: Renders custom action triggers (e.g., sync, refresh, batch operations) featuring pending loading spinners and contextual tooltips.

### Implementation

```tsx
import React from "react";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/shadcn-io/spinner";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { TableExtraActionButton } from "@/models/table-model";

interface DataTableExtraActionProps {
  tableExtraActionProps: TableExtraActionButton;
}

export const DataTableExtra: React.FC<DataTableExtraActionProps> = ({
  tableExtraActionProps,
}) => {
  const Icon = tableExtraActionProps.icon;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button className="{tableExtraActionProps.className}" disabled="{tableExtraActionProps.isPending}" onClick="{tableExtraActionProps.onClick}" size="sm" variant="{tableExtraActionProps.variant}">
          {tableExtraActionProps.isPending ? (
            <>
              <Spinner variant="circle"/>
              <span>{tableExtraActionProps.pendingLabel}</span>
            </>
          ) : (
            <>
              {Icon && <Icon size="{10}"/>}
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

---

## 9. Add Button Component (`DataTableAdd`)

* **File Location**: `src/components/shared/data-table/data-table-add.tsx`
* **Purpose**: Standardized entity creation trigger button inside the table toolbar.

### Implementation

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
    <Button className="ml-auto hidden h-9 lg:flex" onClick="{tableAddProps.addFunction}" size="sm" variant="custom">
      <IconPlus size="{10}"/>
      <span>{tableAddProps.addButtonLabel}</span>
    </Button>
  );
};

export default DataTableAdd;

```

---

## 10. Row Actions Component (`DataTableRowActions`)

* **File Location**: `src/components/shared/data-table/data-table-row-actions.tsx`
* **Purpose**: Standardized inline row action bar providing permission-aware action icons (View, Edit, Block/Unblock, Audit Compare, Delete) with color-coded tooltips.

### Implementation

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
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from '@/components/ui/tooltip'

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
            <Button onClick="{()" size="sm" variant="outline"> onBlock?.(row.original)}
              className={cn(
                buttonClass,
                isBlocked
                  ? 'text-green-500 hover:border-green-300 hover:text-green-600'
                  : 'text-amber-500 hover:border-amber-300 hover:text-amber-600'
              )}
            >
              {isBlocked ? <IconLockOpen size="{16}"/> : <IconLock size="{16}"/>}
            </Button>
          </TooltipTrigger>
          <TooltipContent 'bg-amber-500' 'bg-green-500' 'fill-amber-500' 'fill-green-500' 'text-white', )} : ? arrowClass="{cn(" colorClass="{cn(" isBlocked>
            {tooltipMessage}
          </TooltipContent>
        </Tooltip>
      )}

      {onView && canView && (
        <Tooltip>
          <TooltipTrigger asChild>
            <Button onClick="{()" size="sm" variant="outline"> onView?.(row.original)}
              className={cn(
                buttonClass,
                'text-blue-500 hover:border-blue-300 hover:text-blue-600'
              )}
            >
              <IconEye size="{16}"/>
            </Button>
          </TooltipTrigger>
          <TooltipContent arrowClass="fill-blue-500" colorClass="bg-blue-500 text-white">
            {t('view')}
          </TooltipContent>
        </Tooltip>
      )}

      {onEdit && canEdit && (
        <Tooltip>
          <TooltipTrigger asChild>
            <Button onClick="{()" size="sm" variant="outline"> onEdit?.(row.original)}
              className={cn(
                buttonClass,
                'text-green-500 hover:border-green-300 hover:text-green-600'
              )}
            >
              <IconEdit size="{16}"/>
            </Button>
          </TooltipTrigger>
          <TooltipContent arrowClass="fill-green-500" colorClass="bg-green-500 text-white">
            {t('edit')}
          </TooltipContent>
        </Tooltip>
      )}

      {onCompare && canView && (
        <Tooltip>
          <TooltipTrigger asChild>
            <Button onClick="{()" size="sm" variant="outline"> onCompare?.(row.original)}
              className={cn(
                buttonClass,
                'text-blue-500 hover:border-blue-300 hover:text-blue-600'
              )}
            >
              <IconHistory size="{16}"/>
            </Button>
          </TooltipTrigger>
          <TooltipContent arrowClass="fill-blue-500" colorClass="bg-blue-500 text-white">
            {t('audit')}
          </TooltipContent>
        </Tooltip>
      )}

      {onDelete && canDelete && (
        <Tooltip>
          <TooltipTrigger asChild>
            <Button onClick="{()" size="sm" variant="outline"> onDelete?.(row.original)}
              className={cn(
                buttonClass,
                'text-destructive hover:border-red-300 hover:text-red-600'
              )}
            >
              <IconTrash size="{16}"/>
            </Button>
          </TooltipTrigger>
          <TooltipContent arrowClass="fill-destructive" colorClass="bg-destructive text-white">
            {t('delete')}
          </TooltipContent>
        </Tooltip>
      )}
    </div>
  )
}

```

---

## 11. Pagination Component (`DataTablePagination`)

* **File Location**: `src/components/shared/data-table/data-table-pagination.tsx`
* **Purpose**: Manages page size adjustments, page navigation triggers, and switches between local table state and backend API parameters (`setQueryParams`).

### Implementation

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
        setQueryParams?.({
          ...queryParams,
          page: pagination.page + 1,
        })
      }
    } else {
      table.nextPage()
    }
  }

  const handlePreviousPage = () => {
    if (isBackendPagination) {
      if (pagination && pagination.page > 1) {
        setQueryParams?.({
          ...queryParams,
          page: pagination.page - 1,
        })
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
    <div
      className="flex items-center justify-between overflow-clip px-5"
      style={{ overflowClipMargin: 1 }}
    >
      <div className="text-muted-foreground hidden flex-1 text-sm sm:block">
        {t('page')} {currentPage} {t('of')} {totalPages}
      </div>

      <div className="flex items-center sm:space-x-6 lg:space-x-8">
        <div className="flex items-center space-x-2">
          <p className="hidden text-sm font-medium sm:block">{t('rows_per_page')}</p>
          <Select onValueChange="{(value)" value="{`${table.getState().pagination.pageSize}`}"> {
              const size = Number(value)
              table.setPageSize(size)

              if (isBackendPagination) {
                setQueryParams?.({
                  ...queryParams,
                  pageSize: size,
                  page: 1,
                })
              }
            }}
          >
            <SelectTrigger className="h-8 w-[70px]">
              <SelectValue placeholder="{table.getState().pagination.pageSize}"/>
            </SelectTrigger>
            <SelectContent side="top">
              {[10, 20, 30, 40, 50].map((pageSize) => (
                <SelectItem key="{pageSize}" value="{`${pageSize}`}">
                  {pageSize}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center space-x-2">
          <Button <="1}" className="hidden h-8 w-8 p-0 lg:flex" disabled="{currentPage" onClick="{handleFirstPage}" variant="outline">
            <span className="sr-only">Go to first page</span>
            <DoubleArrowLeftIcon className="h-4 w-4"/>
          </Button>

          <Button <="1}" className="h-8 w-8 p-0" disabled="{currentPage" onClick="{handlePreviousPage}" variant="outline">
            <span className="sr-only">Go to previous page</span>
            <ChevronLeftIcon className="h-4 w-4"/>
          </Button>

          <Button className="h-8 w-8 p-0" disabled="{currentPage" onClick="{handleNextPage}" variant="outline">= totalPages}
          >
            <span className="sr-only">Go to next page</span>
            <ChevronRightIcon className="h-4 w-4"/>
          </Button>

          <Button className="hidden h-8 w-8 p-0 lg:flex" disabled="{currentPage" onClick="{handleLastPage}" variant="outline">= totalPages}
          >
            <span className="sr-only">Go to last page</span>
            <DoubleArrowRightIcon className="h-4 w-4"/>
          </Button>
        </div>
      </div>
    </div>
  )
}

```

---

## 12. Implementation Example

A complete integration example showing how all sub-components function together inside a page view:

```tsx
import { ColumnDef } from '@tanstack/react-table'
import { IconRefresh } from '@tabler/icons-react'
import { User } from '@/models/user-model'
import { DataTable } from '@/components/shared/data-table/data-table'
import { DataTableRowActions } from '@/components/shared/data-table/data-table-row-actions'

export function UserListView() {
  const {
    data,
    isLoading,
    isSyncing,
    syncUsers,
    queryParams,
    setQueryParams,
    handleView,
    handleEdit,
    handleDelete,
    handleToggleBlock,
  } = useGetUsers()

  const columns: ColumnDef<User>[] = [
    {
      accessorKey: 'name',
      header: 'Name',
      meta: { className: 'w-[200px]' },
    },
    {
      accessorKey: 'email',
      header: 'Email',
    },
    {
      id: 'actions',
      header: 'Actions',
      meta: { className: 'w-[120px] text-right' },
      cell: ({ row }) => (
        <DataTableRowActions 'Block 'Unblock : ? User' User'} isBlocked="{row.original.isBlocked}" onView="{(user)" row="{row}" tooltipMessage="{row.original.isBlocked"> handleView(user.id)}
          onEdit={(user) => handleEdit(user.id)}
          onBlock={(user) => handleToggleBlock(user.id)}
          onDelete={(user) => handleDelete(user.id)}
          canEdit={true}
          canDelete={true}
        />
      ),
    },
  ]

  return (
    <DataTable 'Search 'Sync 'Synchronize 'Syncing...', 'outline', IconRefresh, Users', []} backend', columns="{columns}" data="{data?.items" extraAction: icon: isLoading="{isLoading}" isPending: isSyncing, label: onClick: pagination="{data?.pagination}" pendingLabel: placeholder: queryParams="{queryParams}" registry resetFilterQueryParams: setQueryParams="{setQueryParams}" setQueryParams, syncUsers, tableFilterProps: tableSearchProps: toolbarProps="{{" tooltip: user users...', variant: with { || },> setQueryParams({ role: '', status: '' }),
          formFields: [
            {
              name: 'role',
              label: 'Role',
              type: 'dropdown',
              items: [
                { label: 'Admin', value: 'admin' },
                { label: 'User', value: 'user' },
              ],
            },
            {
              name: 'start',
              label: 'Created After',
              type: 'date',
            },
          ],
        },
      }}
    />
  )
}


```