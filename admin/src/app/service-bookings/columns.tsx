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
import { MoreHorizontal, Download } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import Link from "next/link";
import ServiceCostPanel from "@/components/ServiceCostPanel";
import { formatToEAT } from "@/lib/utils";
import { downloadServiceBookingReceipt } from "@/lib/service-booking-receipt-generator";

export type ServiceBookingRow = {
  id: string;
  serviceTitle: string;
  customerName: string;
  customerEmail: string;
  status: "pending" | "confirmed" | "in_progress" | "completed" | "cancelled" | string;
  payment_status?: string;
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
    enableHiding: false,
  },
  {
    accessorKey: "serviceTitle",
    header: "Service",
    cell: ({ row }) => {
      const v = row.getValue<string>("serviceTitle");
      return <span className="font-medium max-w-[120px] sm:max-w-[200px] truncate block text-xs sm:text-sm">{v || "Unknown"}</span>;
    },
    enableHiding: false,
  },
  {
    accessorKey: "customerName",
    header: "Customer",
    cell: ({ row }) => {
      const name = row.getValue<string>("customerName");
      return <span className="max-w-[150px] truncate block text-xs sm:text-sm">{name}</span>;
    },
    enableHiding: true,
    meta: { hideOnMobile: true },
  },
  {
    accessorKey: "customerEmail",
    header: "Email",
    cell: ({ row }) => {
      const email = row.getValue<string>("customerEmail");
      return <span className="max-w-[180px] truncate block text-xs sm:text-sm">{email}</span>;
    },
    enableHiding: true,
    meta: { hideOnMobile: true },
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
      return <Badge variant={variant as any} className="text-xs whitespace-nowrap">{label}</Badge>;
    },
    enableHiding: false,
  },
  {
    accessorKey: "scheduledDate",
    header: "Scheduled",
    cell: ({ row }) => {
      const iso = row.getValue<string | undefined>("scheduledDate");
      const formatted = iso ? formatToEAT(iso, { dateStyle: 'medium', timeStyle: 'short' }) : 'Not scheduled';
      return <div className="text-xs sm:text-sm whitespace-nowrap">{formatted}</div>;
    },
    enableHiding: true,
    meta: { hideOnMobile: true },
  },
  {
    accessorKey: "total",
    header: "Total",
    cell: ({ row }) => <div className="text-xs sm:text-sm font-medium whitespace-nowrap">{formatTZS(Number(row.getValue("total")))}</div>,
    enableHiding: false,
  },
  {
    accessorKey: "createdAt",
    header: "Created",
    cell: ({ row }) => {
      const iso = row.getValue<string>("createdAt");
      const formatted = formatToEAT(iso, { dateStyle: 'short', timeStyle: 'short' });
      return <div className="text-xs sm:text-sm whitespace-nowrap">{formatted}</div>;
    },
    enableHiding: true,
    meta: { hideOnMobile: true },
  },
  {
    id: "actions",
    enableHiding: false,
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

      const handleDownloadReceipt = async () => {
        try {
          // Always get fresh data (avoid cache delays after saving costs)
          const detailsRes = await fetch(`/api/service-bookings/${booking.id}/details`, {
            cache: 'no-store',
            headers: { 'Cache-Control': 'no-store' }
          });
          if (!detailsRes.ok) {
            throw new Error('Failed to fetch booking details');
          }
          const details = await detailsRes.json();

          // Prefer costs from details endpoint, but if not present or empty, fallback to service-costs API
          let serviceCosts = details.serviceCosts ?? null;
          if (!serviceCosts || (Array.isArray(serviceCosts.items) && serviceCosts.items.length === 0)) {
            try {
              const costsRes = await fetch(`/api/service-costs/${booking.id}`, {
                cache: 'no-store',
                headers: { 'Cache-Control': 'no-store' }
              });
              if (costsRes.ok) {
                const json = await costsRes.json();
                const c = json?.data;
                if (c) {
                  serviceCosts = {
                    id: c.id,
                    service_fee: Number(c.service_fee || 0),
                    discount: Number(c.discount || 0),
                    currency: c.currency || 'TZS',
                    subtotal: Number(c.subtotal || 0),
                    total: Number(c.total || 0),
                    notes: c.notes || null,
                    items: Array.isArray(c.items) ? c.items.map((it: any) => ({
                      id: it.id,
                      name: it.name,
                      unit_price: Number(it.unit_price || 0),
                      quantity: Number(it.quantity || 0),
                      unit: it.unit || 'unit'
                    })) : []
                  };
                }
              }
            } catch (e) {
              console.warn('Fallback fetch of service costs failed:', e);
            }
          }

          await downloadServiceBookingReceipt({
            booking: details.booking,
            serviceCosts
          });
          toast({ title: 'Success', description: 'Receipt downloaded successfully' });
        } catch (error) {
          console.error('Failed to download receipt:', error);
          toast({ title: 'Error', description: 'Failed to download receipt. Please try again.', variant: 'destructive' });
        }
      };

      return (
        <Sheet>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-9 w-9 sm:h-8 sm:w-8 p-0">
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
              {booking.payment_status === 'paid' && (
                <>
                  <DropdownMenuItem onClick={handleDownloadReceipt}>
                    <Download className="mr-0.5 h-4 w-4" />
                    Download Receipt
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                </>
              )}
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
