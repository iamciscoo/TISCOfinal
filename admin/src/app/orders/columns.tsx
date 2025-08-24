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
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuPortal,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown, MoreHorizontal } from "lucide-react";
import Link from "next/link";
import { toast } from "@/hooks/use-toast";
import type { OrderColumn as Order } from "@/lib/ui-types";


export const columns: ColumnDef<Order>[] = [
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
  },
  {
    accessorKey: "id",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Order ID
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      const id = row.getValue("id") as string;
      return <div className="font-mono text-sm">{id}</div>;
    },
  },
  {
    accessorKey: "customerName",
    header: "Customer",
    cell: ({ row }) => {
      const name = row.getValue("customerName") as string;
      const email = row.original.customerEmail;
      return (
        <div>
          <div className="font-medium">{name}</div>
          <div className="text-sm text-gray-500">{email}</div>
        </div>
      );
    },
  },
  {
    accessorKey: "total",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Total
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      const total = parseFloat(row.getValue("total"));
      const formatted = `TZS ${Number(total || 0).toLocaleString()}`;
      return <div className="font-medium">{formatted}</div>;
    },
  },
  {
    accessorKey: "items",
    header: "Items",
    cell: ({ row }) => {
      const items = row.getValue("items") as number;
      return <div className="text-center">{items}</div>;
    },
  },
  {
    accessorKey: "status",
    header: "Order Status",
    cell: ({ row }) => {
      const status = row.getValue("status") as string;
      const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
        pending: "outline",
        confirmed: "secondary",
        processing: "secondary",
        shipped: "default",
        delivered: "default",
        cancelled: "destructive",
      };
      
      return (
        <Badge variant={variants[status] || "secondary"}>
          {status.charAt(0).toUpperCase() + status.slice(1)}
        </Badge>
      );
    },
  },
  {
    accessorKey: "paymentStatus",
    header: "Payment",
    cell: ({ row }) => {
      const status = row.getValue("paymentStatus") as string;
      const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
        pending: "outline",
        paid: "default",
        failed: "destructive",
        refunded: "secondary",
      };
      
      return (
        <Badge variant={variants[status] || "secondary"}>
          {status.charAt(0).toUpperCase() + status.slice(1)}
        </Badge>
      );
    },
  },
  {
    accessorKey: "createdAt",
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
      const date = row.getValue("createdAt") as string;
      return <div>{new Date(date).toLocaleDateString()}</div>;
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const order = row.original;

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuItem
              onClick={() => navigator.clipboard.writeText(order.id)}
            >
              Copy order ID
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <Link href={`/orders/${order.id}`}>View details</Link>
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Link href={`/users/${order.customerId}`}>View customer</Link>
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={async () => {
                const response = await fetch(`/api/orders/${order.id}`, {
                  method: 'PATCH',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ payment_status: 'paid' })
                })
                if (response.ok) {
                  toast({ title: "Marked as paid" })
                  window.location.reload()
                } else {
                  toast({ title: "Failed to update payment", variant: "destructive" })
                }
              }}
            >
              Mark as paid
            </DropdownMenuItem>
            <DropdownMenuSub>
              <DropdownMenuSubTrigger>Change status</DropdownMenuSubTrigger>
              <DropdownMenuPortal>
                <DropdownMenuSubContent>
                  <DropdownMenuItem
                    onClick={async () => {
                      const response = await fetch(`/api/orders/${order.id}/status`, {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ 
                          status: 'processing',
                          reason: 'Status updated by admin'
                        })
                      })
                      if (response.ok) {
                        toast({ title: "Order updated successfully" })
                        window.location.reload()
                      } else {
                        toast({ title: "Failed to update order", variant: "destructive" })
                      }
                    }}
                  >
                    Mark as processing
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={async () => {
                      const response = await fetch(`/api/orders/${order.id}/status`, {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ 
                          status: 'shipped',
                          reason: 'Status updated by admin'
                        })
                      })
                      if (response.ok) {
                        toast({ title: "Order updated successfully" })
                        window.location.reload()
                      } else {
                        toast({ title: "Failed to update order", variant: "destructive" })
                      }
                    }}
                  >
                    Mark as shipped
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={async () => {
                      const response = await fetch(`/api/orders/${order.id}/status`, {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ 
                          status: 'delivered',
                          reason: 'Status updated by admin'
                        })
                      })
                      if (response.ok) {
                        toast({ title: "Order updated successfully" })
                        window.location.reload()
                      } else {
                        toast({ title: "Failed to update order", variant: "destructive" })
                      }
                    }}
                  >
                    Mark as delivered
                  </DropdownMenuItem>
                </DropdownMenuSubContent>
              </DropdownMenuPortal>
            </DropdownMenuSub>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-red-600"
              onClick={async () => {
                const confirmed = window.confirm(`Cancel order ${order.id}?`);
                if (!confirmed) return;
                const response = await fetch(`/api/orders/${order.id}/status`, {
                  method: 'PATCH',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ 
                    status: 'cancelled',
                    reason: 'Cancelled by admin'
                  })
                })
                if (response.ok) {
                  toast({ title: "Order cancelled successfully" })
                  window.location.reload()
                } else {
                  toast({ title: "Failed to cancel order", variant: "destructive" })
                }
              }}
            >
              Cancel order
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];
