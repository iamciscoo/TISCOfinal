"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Sheet, SheetTrigger } from "@/components/ui/sheet";
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
import { MoreHorizontal } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import Link from "next/link";
import ServiceCostPanel from "@/components/ServiceCostPanel";

export type ServiceBookingRow = {
  id: string;
  serviceTitle: string;
  customerName: string;
  customerEmail: string;
  status: "pending" | "confirmed" | "in_progress" | "completed" | "cancelled" | string;
  scheduledDate?: string;
  total: number;
  createdAt: string;
};

function formatTZS(value: number) {
  if (isNaN(value)) return "TZS 0";
  return `TZS ${Math.round(value).toLocaleString()}`;
}

export const columns: ColumnDef<ServiceBookingRow>[] = [
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
    accessorKey: "serviceTitle",
    header: "Service",
    cell: ({ row }) => {
      const v = row.getValue<string>("serviceTitle");
      return <span className="font-medium max-w-[200px] truncate block">{v || "Unknown"}</span>;
    },
  },
  {
    accessorKey: "customerName",
    header: "Customer",
    cell: ({ row }) => {
      const name = row.getValue<string>("customerName");
      return <span className="max-w-[150px] truncate block">{name}</span>;
    },
  },
  {
    accessorKey: "customerEmail",
    header: "Email",
    cell: ({ row }) => {
      const email = row.getValue<string>("customerEmail");
      return <span className="max-w-[180px] truncate block text-sm">{email}</span>;
    },
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const s = row.getValue<string>("status");
      const variant =
        s === "completed"
          ? "default"
          : s === "confirmed"
          ? "secondary"
          : s === "in_progress"
          ? "outline"
          : s === "cancelled"
          ? "destructive"
          : "secondary";
      const label = s?.replace(/_/g, " ") || "unknown";
      return <Badge variant={variant as any}>{label}</Badge>;
    },
  },
  {
    accessorKey: "scheduledDate",
    header: "Scheduled",
    cell: ({ row }) => {
      const iso = row.getValue<string | undefined>("scheduledDate");
      const formatted = iso ? new Date(iso).toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }) : "-";
      return <span className="text-sm whitespace-nowrap">{formatted}</span>;
    },
  },
  {
    accessorKey: "total",
    header: "Total",
    cell: ({ row }) => formatTZS(Number(row.getValue("total"))),
  },
  {
    accessorKey: "createdAt",
    header: "Created",
    cell: ({ row }) => {
      const iso = row.getValue<string>("createdAt");
      const formatted = new Date(iso).toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: '2-digit'
      });
      return <span className="text-sm whitespace-nowrap">{formatted}</span>;
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const booking = row.original;
      const updateStatus = async (status: ServiceBookingRow["status"]) => {
        const response = await fetch(`/api/service-bookings/${booking.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status }),
        });
        if (response.ok) {
          toast({ title: "Booking updated" });
          window.location.reload();
        } else {
          toast({ title: "Failed to update status", variant: "destructive" });
        }
      };

      const clearSchedule = async () => {
        const response = await fetch(`/api/service-bookings/${booking.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ preferred_date: null, preferred_time: null }),
        });
        if (response.ok) {
          toast({ title: "Schedule cleared" });
          window.location.reload();
        } else {
          toast({ title: "Failed to clear schedule", variant: "destructive" });
        }
      };

      const markPaid = async () => {
        const response = await fetch(`/api/service-bookings/${booking.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ payment_status: "paid" }),
        });
        if (response.ok) {
          toast({ title: "Marked as paid" });
          window.location.reload();
        } else {
          const msg = await response.json().catch(() => ({}));
          toast({ title: msg?.error || "Failed to mark as paid", variant: "destructive" });
        }
      };

      const markUnpaid = async () => {
        const response = await fetch(`/api/service-bookings/${booking.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ payment_status: "pending" }),
        });
        if (response.ok) {
          toast({ title: "Marked as unpaid" });
          window.location.reload();
        } else {
          const msg = await response.json().catch(() => ({}));
          toast({ title: msg?.error || "Failed to mark as unpaid", variant: "destructive" });
        }
      };

      const markPaidAndCompleted = async () => {
        const response = await fetch(`/api/service-bookings/${booking.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ payment_status: "paid", status: "completed" }),
        });
        if (response.ok) {
          toast({ title: "Marked paid & completed" });
          window.location.reload();
        } else {
          const msg = await response.json().catch(() => ({}));
          toast({ title: msg?.error || "Failed to update", variant: "destructive" });
        }
      };

      return (
        <Sheet>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => navigator.clipboard.writeText(booking.id)}>
                Copy booking ID
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <SheetTrigger asChild>
                <DropdownMenuItem>Manage costs</DropdownMenuItem>
              </SheetTrigger>
              <DropdownMenuSeparator />
              <DropdownMenuSub>
                <DropdownMenuSubTrigger>Change status</DropdownMenuSubTrigger>
                <DropdownMenuPortal>
                  <DropdownMenuSubContent>
                    <DropdownMenuItem onClick={() => updateStatus("pending")}>Mark as pending</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => updateStatus("confirmed")}>Mark as confirmed</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => updateStatus("in_progress")}>Mark as in progress</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => updateStatus("completed")}>Mark as completed</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => updateStatus("cancelled")} className="text-red-600">Cancel booking</DropdownMenuItem>
                  </DropdownMenuSubContent>
                </DropdownMenuPortal>
              </DropdownMenuSub>
              <DropdownMenuSub>
                <DropdownMenuSubTrigger>Payment</DropdownMenuSubTrigger>
                <DropdownMenuPortal>
                  <DropdownMenuSubContent>
                    <DropdownMenuItem onClick={markUnpaid}>Mark as unpaid</DropdownMenuItem>
                    <DropdownMenuItem onClick={markPaid}>Mark as paid</DropdownMenuItem>
                    <DropdownMenuItem onClick={markPaidAndCompleted}>Mark paid & completed</DropdownMenuItem>
                  </DropdownMenuSubContent>
                </DropdownMenuPortal>
              </DropdownMenuSub>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <Link href={`/service-bookings/${booking.id}/view`}>View booking</Link>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Link href={`/service-bookings/${booking.id}`}>Edit booking</Link>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={clearSchedule}>Clear schedule</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-red-600"
                onClick={async () => {
                  const confirmed = window.confirm(`Delete booking ${booking.id}? This cannot be undone.`)
                  if (!confirmed) return
                  const response = await fetch(`/api/service-bookings/${booking.id}`, { method: 'DELETE' })
                  if (response.status === 204) {
                    toast({ title: 'Booking deleted' })
                    window.location.reload()
                  } else {
                    const msg = await response.json().catch(() => ({}))
                    toast({ title: msg?.error || 'Failed to delete booking', variant: 'destructive' })
                  }
                }}
              >
                Delete booking
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          {/* Sheet content lives alongside the trigger */}
          <ServiceCostPanel bookingId={booking.id} />
        </Sheet>
      );
    },
  },
];
