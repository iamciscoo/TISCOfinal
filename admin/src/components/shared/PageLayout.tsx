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
    <div className="p-3 sm:p-4 lg:p-6">
      <div className="mb-4 sm:mb-6 lg:mb-8 px-3 py-2 sm:px-4 sm:py-3 bg-secondary rounded-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-3">
        <h1 className="text-base sm:text-lg lg:text-xl font-semibold">{title}</h1>
        {addEntityButton}
      </div>
      <div className="overflow-x-auto px-3 sm:px-0">
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
