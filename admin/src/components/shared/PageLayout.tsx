import { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "../ui/data-table";
import { ReactNode } from "react";

interface PageLayoutProps<TData, TValue> {
  title: string;
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  entityName?: string;
  addEntityButton?: ReactNode;
  deleteApiBase?: string;
}

export function PageLayout<TData, TValue>({
  title,
  columns,
  data,
  entityName,
  addEntityButton,
  deleteApiBase,
}: PageLayoutProps<TData, TValue>) {
  return (
    <div className="p-4 sm:p-6">
      <div className="mb-6 sm:mb-8 px-4 py-3 bg-secondary rounded-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <h1 className="text-lg sm:text-xl font-semibold">{title}</h1>
        {addEntityButton}
      </div>
      <div className="overflow-x-auto">
        <DataTable 
          columns={columns} 
          data={data} 
          entityName={entityName}
          deleteApiBase={deleteApiBase}
        />
      </div>
    </div>
  );
}
