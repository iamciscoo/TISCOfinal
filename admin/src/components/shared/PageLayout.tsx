import { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "./DataTable";

interface PageLayoutProps<TData, TValue> {
  title: string;
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  entityName?: string;
}

export function PageLayout<TData, TValue>({
  title,
  columns,
  data,
  entityName,
}: PageLayoutProps<TData, TValue>) {
  return (
    <div className="">
      <div className="mb-8 px-4 py-2 bg-secondary rounded-md">
        <h1 className="font-semibold">{title}</h1>
      </div>
      <DataTable columns={columns} data={data} entityName={entityName} />
    </div>
  );
}
