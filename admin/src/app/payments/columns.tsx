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
import { ArrowUpDown, MoreHorizontal } from "lucide-react";
import Link from "next/link";

export type Payment = {
  id: string;
  amount: number;
  fullName: string;
  userId: string;
  email: string;
  status: "pending" | "paid" | "failed" | "refunded";
};

export const columns: ColumnDef<Payment>[] = [
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
    accessorKey: "fullName",
    header: "User",
    cell: ({ row }) => {
      const name = row.getValue("fullName") as string;
      return <div className="min-w-[100px] sm:min-w-[120px] text-xs sm:text-sm font-medium">{name}</div>;
    },
    enableHiding: false,
  },
  {
    accessorKey: "email",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Email
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      const email = row.getValue("email") as string;
      return <div className="text-xs sm:text-sm truncate max-w-[150px] sm:max-w-[200px]">{email}</div>;
    },
    enableHiding: true,
    meta: { hideOnMobile: true },
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.getValue("status");

      return (
        <div
          className={cn(
            `p-1 rounded-md w-max text-xs whitespace-nowrap`,
            status === "pending" && "bg-yellow-500/40 dark:bg-yellow-500/20",
            status === "paid" && "bg-green-500/40 dark:bg-green-500/20",
            status === "failed" && "bg-red-500/40 dark:bg-red-500/20",
            status === "refunded" && "bg-blue-500/30 dark:bg-blue-500/20"
          )}
        >
          {status as string}
        </div>
      );
    },
    enableHiding: false,
  },
  {
    accessorKey: "amount",
    header: () => <div className="text-right">Amount</div>,
    cell: ({ row }) => {
      const amount = parseFloat(row.getValue("amount"));
      const formatted = `TZS ${Number(amount || 0).toLocaleString()}`;

      return <div className="text-right font-medium text-xs sm:text-sm whitespace-nowrap">{formatted}</div>;
    },
    enableHiding: false,
  },
  {
    id: "actions",
    enableHiding: false,
    cell: ({ row }) => {
      const payment = row.original;

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
              onClick={() => navigator.clipboard.writeText(payment.id)}
            >
              Copy payment ID
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <Link href={`/users/${payment.userId}`}>View customer</Link>
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Link href={`/payments/${payment.id}`}>View payment details</Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];
