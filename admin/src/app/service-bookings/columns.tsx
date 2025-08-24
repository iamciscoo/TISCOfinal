"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";

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
    accessorKey: "serviceTitle",
    header: "Service",
    cell: ({ row }) => {
      const v = row.getValue<string>("serviceTitle");
      return <span className="font-medium">{v || "Unknown"}</span>;
    },
  },
  {
    accessorKey: "customerName",
    header: "Customer",
  },
  {
    accessorKey: "customerEmail",
    header: "Email",
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
      return <span className="text-sm">{iso ? new Date(iso).toLocaleString() : "-"}</span>;
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
      return <span className="text-sm">{new Date(iso).toLocaleString()}</span>;
    },
  },
];
