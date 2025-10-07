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
import Image from "next/image";
import Link from "next/link";
import { toast } from "@/hooks/use-toast";
import type { UserColumn as User } from "@/lib/ui-types";


export const columns: ColumnDef<User>[] = [
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
    accessorKey: "avatar",
    header: "Avatar",
    cell: ({ row }) => {
      const user = row.original;
      return (
        <div className="w-10 h-10 sm:w-9 sm:h-9 relative flex-shrink-0">
          <Image
            src={user.avatar}
            alt={user.fullName}
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
    accessorKey: "fullName",
    header: "User",
    cell: ({ row }) => {
      const name = row.getValue("fullName") as string;
      return <div className="min-w-[120px] text-xs sm:text-sm font-medium">{name}</div>;
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
    id: "actions",
    enableHiding: false,
    cell: ({ row }) => {
      const user = row.original;

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
              onClick={() => navigator.clipboard.writeText(user.id || 'No ID')}
            >
              Copy user ID
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <Link href={`/users/${user.id || 'guest'}`}>View customer</Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-red-600"
              onClick={async () => {
                const confirmed = window.confirm(`Delete user ${user.fullName}? This cannot be undone.`);
                if (!confirmed) return;
                try {
                  const res = await fetch(`/api/users/${user.id || 'guest'}` , { method: "DELETE" });
                  if (!res.ok) {
                    const json = await res.json().catch(() => ({}));
                    throw new Error(json?.error || "Failed to delete user");
                  }
                  toast({ title: "Deleted", description: "User deleted successfully" });
                  window.location.reload();
                } catch (e) {
                  console.error("Delete user failed", e);
                  toast({ title: "Error", description: "Failed to delete user", variant: "destructive" });
                }
              }}
            >
              Delete user
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];
