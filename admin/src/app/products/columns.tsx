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
import { cn } from "@/lib/utils";
import { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown, MoreHorizontal, Eye } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { toast } from "@/hooks/use-toast";
import type { ProductColumn } from "@/lib/ui-types";
export type Product = ProductColumn;


export const columns: ColumnDef<Product>[] = [
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
    accessorKey: "image",
    header: "Image",
    cell: ({ row }) => {
      const product = row.original;
      return (
        <div className="w-10 h-10 sm:w-9 sm:h-9 relative flex-shrink-0">
          <Image
            src={product.images[product.colors[0]]}
            alt={product.name}
            fill
            sizes="40px"
            className="rounded-full object-cover"
          />
        </div>
      );
    },
    enableHiding: false,
  },
  {
    accessorKey: "name",
    header: "Name",
    cell: ({ row }) => {
      const name = row.getValue("name") as string;
      return <div className="min-w-[100px] sm:min-w-[150px] text-xs sm:text-sm font-medium">{name}</div>;
    },
    enableHiding: false,
  },
  {
    accessorKey: "price",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Price
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      const price = row.getValue("price") as number;
      return <div className="text-xs sm:text-sm font-medium whitespace-nowrap">{price}</div>;
    },
    enableHiding: true,
    meta: { hideOnMobile: true },
  },
  {
    accessorKey: "shortDescription",
    header: "Description",
    cell: ({ row }) => {
      const desc = row.getValue("shortDescription") as string;
      return <div className="text-xs text-muted-foreground max-w-[200px] truncate">{desc}</div>;
    },
    enableHiding: true,
    meta: { hideOnMobile: true },
  },
  {
    accessorKey: "category",
    header: "Category",
    cell: ({ row }) => {
      const product = row.original;
      // Handle both old and new category structure
      const categories = product.categories || [];
      if (categories.length === 0) return <span className="text-xs sm:text-sm">General</span>;
      
      // Display first category name, with count if multiple
      const firstCategory = categories[0]?.category?.name || categories[0]?.name;
      const additionalCount = categories.length - 1;
      
      return (
        <div className="flex items-center gap-1 text-xs sm:text-sm">
          <span className="truncate max-w-[100px]">{firstCategory}</span>
          {additionalCount > 0 && (
            <span className="px-1.5 py-0.5 text-xs bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 rounded-full">
              +{additionalCount}
            </span>
          )}
        </div>
      );
    },
    enableHiding: true,
    meta: { hideOnMobile: true },
  },
  {
    accessorKey: "stock_quantity",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Stock
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      const product = row.original;
      const stock = product.stock_quantity || 0;
      return (
        <span className={cn(
          "px-2 py-1 rounded-full text-xs font-medium whitespace-nowrap",
          stock < 10 ? "bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200" : 
          stock < 50 ? "bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200" : 
          "bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200"
        )}>
          {stock}
        </span>
      );
    },
    enableHiding: true,
    meta: { hideOnMobile: true },
  },
  {
    accessorKey: "view_count",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="gap-1"
        >
          <Eye className="h-4 w-4" />
          Views
          <ArrowUpDown className="ml-1 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      const viewCount = row.original.view_count || 0;
      return (
        <div className="flex items-center gap-2 text-xs sm:text-sm font-medium text-muted-foreground whitespace-nowrap">
          <Eye className="h-3.5 w-3.5 text-gray-400" />
          {viewCount.toLocaleString()}
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
      const createdAt = row.original.created_at;
      if (!createdAt) return <div className="text-xs text-muted-foreground">—</div>;
      
      const date = new Date(createdAt);
      const formattedDate = date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric',
        year: 'numeric'
      });
      const formattedTime = date.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit'
      });
      
      return (
        <div className="text-xs text-muted-foreground whitespace-nowrap">
          <div>{formattedDate}</div>
          <div className="text-[10px] text-gray-400">{formattedTime}</div>
        </div>
      );
    },
    enableHiding: true,
    meta: { hideOnMobile: true },
  },
  {
    id: "actions",
    enableHiding: false,
    cell: ({ row }) => {
      const product = row.original;

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
              onClick={() => navigator.clipboard.writeText(product.id.toString())}
            >
              Copy product ID
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <Link href={`/products/${product.id}`}>View product</Link>
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Link href={`/products/${product.id}/edit`}>Edit product</Link>
            </DropdownMenuItem>
            <DropdownMenuItem
              className="text-red-600"
              onClick={async () => {
                const confirmed = window.confirm(`Delete product ${product.name}? This cannot be undone.`);
                if (!confirmed) return;
                try {
                  const res = await fetch(`/api/products/${product.id}` , { method: "DELETE" });
                  if (!res.ok) {
                    const json = await res.json().catch(() => ({}));
                    throw new Error(json?.error || "Failed to delete product");
                  }
                  toast({ title: "Deleted", description: "Product deleted successfully" });
                  window.location.reload();
                } catch (e) {
                  console.error("Delete product failed", e);
                  toast({ title: "Error", description: "Failed to delete product", variant: "destructive" });
                }
              }}
            >
              Delete product
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];
