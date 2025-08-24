"use client";

import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable,
} from "@tanstack/react-table";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { DataTablePagination } from "@/components/TablePagination";
import { useState } from "react";
import { Trash2, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  entityName?: string; // e.g., "User", "Product", "Payment"
  deleteApiBase?: string; // e.g., "/api/orders" — DELETE {base}/{id}
}

export function DataTable<TData, TValue>({
  columns,
  data,
  entityName = "Item",
  deleteApiBase,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [rowSelection, setRowSelection] = useState({});
  const [deleting, setDeleting] = useState(false);
  const { toast } = useToast();

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onSortingChange: setSorting,
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      rowSelection,
    },
  });

  const handleDeleteSelected = async () => {
    if (!deleteApiBase) return;
    const selected = table.getSelectedRowModel().rows;
    const ids = selected
      .map((r) => (r.original as any)?.id)
      .filter((v) => v !== undefined && v !== null);

    if (ids.length === 0) {
      toast({ title: `No ${entityName.toLowerCase()} selected`, variant: "destructive" });
      return;
    }

    const confirmed = window.confirm(`Delete ${ids.length} ${entityName}(s)? This cannot be undone.`);
    if (!confirmed) return;

    setDeleting(true);
    try {
      const results = await Promise.all(
        ids.map((id) => fetch(`${deleteApiBase}/${id}`, { method: "DELETE" }))
      );
      const ok = results.every((r) => r.ok);
      if (!ok) throw new Error("One or more deletions failed");
      toast({ title: `${entityName}(s) deleted` });
      window.location.reload();
    } catch (e) {
      console.error("Bulk delete failed", e);
      toast({ title: "Failed to delete", variant: "destructive" });
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="rounded-md border">
      {deleteApiBase && Object.keys(rowSelection).length > 0 && (
        <div className="flex justify-end">
          <button
            onClick={handleDeleteSelected}
            disabled={deleting}
            className="flex items-center gap-2 bg-red-500 text-white px-2 py-1 text-sm rounded-md m-4 cursor-pointer disabled:opacity-60"
          >
            {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />} 
            Delete {entityName}(s)
          </button>
        </div>
      )}
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => {
                return (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                );
              })}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows?.length ? (
            table.getRowModel().rows.map((row) => (
              <TableRow
                key={row.id}
                data-state={row.getIsSelected() && "selected"}
              >
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={columns.length} className="h-24 text-center">
                No results.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
      <DataTablePagination table={table} />
    </div>
  );
}
