import { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "./DataTable";
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
    <div className="">
      <div className="mb-8 px-4 py-2 bg-secondary rounded-md flex items-center justify-between">
        <h1 className="font-semibold">{title}</h1>
        {addEntityButton}
      </div>
      <DataTable 
        columns={columns} 
        data={data} 
        entityName={entityName}
        deleteApiBase={deleteApiBase}
      />
    </div>
  );
}
