"use client";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
;
import { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown, MoreHorizontal } from "lucide-react";
import Link from "next/link";
import { toast } from "@/hooks/use-toast";
import type { Category } from "@/lib/types";


export const columns: ColumnDef<Category>[] = [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && "indeterminate")
        }
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        checked={row.getIsSelected()}
      />
    ),
    enableHiding: false,
  },
  {
    accessorKey: "name",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Name
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      const name = row.getValue("name") as string;
      return <div className="min-w-[100px] sm:min-w-[150px] text-xs sm:text-sm font-medium">{name}</div>;
    },
    enableHiding: false,
  },
  {
    accessorKey: "description",
    header: "Description",
    cell: ({ row }) => {
      const description = row.getValue("description") as string;
      return (
        <div className="max-w-[150px] sm:max-w-xs truncate text-xs sm:text-sm" title={description}>
          {description}
        </div>
      );
    },
    enableHiding: true,
    meta: { hideOnMobile: true },
  },
  {
    accessorKey: "created_at",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Created
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      const date = row.getValue("created_at") as string;
      if (!date) return <div className="text-xs sm:text-sm">-</div>;
      
      const parsedDate = new Date(date);
      if (isNaN(parsedDate.getTime())) return <div className="text-xs sm:text-sm">-</div>;
      
      return <div className="text-xs sm:text-sm whitespace-nowrap">{parsedDate.toLocaleDateString()}</div>;
    },
    enableHiding: true,
    meta: { hideOnMobile: true },
  },
  {
    id: "actions",
    enableHiding: false,
    cell: ({ row }) => {
      const category = row.original;

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-9 w-9 sm:h-8 sm:w-8 p-0">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuItem
              onClick={() => navigator.clipboard.writeText(String(category.id))}
            >
              Copy category ID
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <Link href={`/categories/${category.id}`}>View category</Link>
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Link href={`/categories/${category.id}/edit`}>Edit category</Link>
            </DropdownMenuItem>
            <DropdownMenuItem
              className="text-red-600"
              onClick={async () => {
                const confirmed = window.confirm(`Delete category ${category.name}? This cannot be undone.`);
                if (!confirmed) return;
                try {
                  const res = await fetch(`/api/categories/${category.id}`, { method: "DELETE" });
                  if (!res.ok) {
                    const json = await res.json().catch(() => ({}));
                    throw new Error(json?.error || "Failed to delete category");
                  }
                  toast({ title: "Deleted", description: "Category deleted successfully" });
                  window.location.reload();
                } catch (e) {
                  console.error("Delete category failed", e);
                  toast({ title: "Error", description: "Failed to delete category", variant: "destructive" });
                }
              }}
            >
              Delete category
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];
