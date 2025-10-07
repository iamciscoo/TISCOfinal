'use client'

import * as React from 'react'
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table'
import { ChevronDown, Loader2, Trash2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useAdminActions } from '@/lib/admin-utils'

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
  searchKey?: string
  searchPlaceholder?: string
  entityName?: string
  deleteApiBase?: string // if provided, enables bulk delete using DELETE {base}/{id}
}

export function DataTable<TData, TValue>({
  columns,
  data,
  searchKey,
  searchPlaceholder = 'Search...',
  entityName = 'Item',
  deleteApiBase,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({})
  const [rowSelection, setRowSelection] = React.useState({})
  const [deleting, setDeleting] = React.useState(false)
  const [isMobile, setIsMobile] = React.useState(false)
  const { handleBulkDelete } = useAdminActions()

  // Detect mobile and auto-hide columns marked with hideOnMobile
  React.useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768
      setIsMobile(mobile)
      
      if (mobile) {
        // Auto-hide columns with hideOnMobile meta on mobile
        const mobileVisibility: VisibilityState = {}
        columns.forEach((column) => {
          const columnMeta = (column as any).meta
          if (columnMeta?.hideOnMobile && 'accessorKey' in column) {
            mobileVisibility[column.accessorKey as string] = false
          }
        })
        setColumnVisibility((prev) => ({ ...prev, ...mobileVisibility }))
      }
    }

    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [columns])

  const table = useReactTable({
    data,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
    },
  })

  const handleDeleteSelected = async () => {
    if (!deleteApiBase) return
    const selected = table.getSelectedRowModel().rows
    const ids = selected
      .map((r) => (r.original as any)?.id)
      .filter((v) => v !== undefined && v !== null)

    if (ids.length === 0) return

    const confirmed = window.confirm(`Delete ${ids.length} ${entityName}(s)? This cannot be undone.`)
    if (!confirmed) return

    setDeleting(true)
    try {
      const urls = ids.map((id) => `${deleteApiBase}/${id}`)
      const result = await handleBulkDelete(urls, entityName)
      if (result.success) {
        setRowSelection({})
      }
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="w-full max-w-full overflow-hidden">
      <div className="flex flex-col sm:flex-row items-start sm:items-center py-3 sm:py-4 gap-2 sm:gap-3">
        {searchKey && (
          <Input
            placeholder={searchPlaceholder}
            value={(table.getColumn(searchKey)?.getFilterValue() as string) ?? ''}
            onChange={(event) =>
              table.getColumn(searchKey)?.setFilterValue(event.target.value)
            }
            className="w-full sm:max-w-sm h-10"
          />
        )}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto sm:ml-auto">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="w-full sm:w-auto h-10 min-h-[44px] sm:min-h-0">
                Columns <ChevronDown className="ml-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="max-h-[300px] overflow-y-auto">
              {table
                .getAllColumns()
                .filter((column) => column.getCanHide())
                .map((column) => {
                  return (
                    <DropdownMenuCheckboxItem
                      key={column.id}
                      className="capitalize"
                      checked={column.getIsVisible()}
                      onCheckedChange={(value) =>
                        column.toggleVisibility(!!value)
                      }
                    >
                      {column.id}
                    </DropdownMenuCheckboxItem>
                  )
                })}
            </DropdownMenuContent>
          </DropdownMenu>
          {deleteApiBase && Object.keys(rowSelection).length > 0 && (
            <Button
              variant="destructive"
              className="w-full sm:w-auto h-10 min-h-[44px] sm:min-h-0"
              onClick={handleDeleteSelected}
              disabled={deleting}
            >
              {deleting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="mr-2 h-4 w-4" />
              )}
              <span className="hidden sm:inline">Delete {entityName}(s)</span>
              <span className="sm:hidden">Delete ({Object.keys(rowSelection).length})</span>
            </Button>
          )}
        </div>
      </div>
      <div className="rounded-md border overflow-x-auto">
        <Table className="min-w-full">
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id} className="whitespace-nowrap text-xs sm:text-sm">
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  )
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && 'selected'}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className="py-3 sm:py-4">
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
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-2 sm:space-y-0 py-3 sm:py-4">
        <div className="text-xs sm:text-sm text-muted-foreground order-2 sm:order-1">
          {table.getFilteredSelectedRowModel().rows.length} of{' '}
          {table.getFilteredRowModel().rows.length} row(s) selected.
        </div>
        <div className="flex gap-2 order-1 sm:order-2 w-full sm:w-auto">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
            className="flex-1 sm:flex-none h-10 min-h-[44px] sm:min-h-0"
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
            className="flex-1 sm:flex-none h-10 min-h-[44px] sm:min-h-0"
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  )
}
