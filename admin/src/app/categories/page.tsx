import { columns } from "./columns";
import { PageLayout } from "@/components/shared/PageLayout";
import { Button } from "@/components/ui/button";
import { Category } from "@/lib/types";
import Link from "next/link";

async function getData(): Promise<Category[]> {
  // Fetch data from your API here.
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/categories`, { cache: 'no-store' });
  if (!res.ok) {
    throw new Error('Failed to fetch categories');
  }
  const data = await res.json();
  return data.categories;
}

const CategoriesPage = async () => {
  const data = await getData();
  return (
    <PageLayout
      title="All Categories"
      columns={columns}
      data={data}
      entityName="Category"
      addEntityButton={
        <Button asChild>
          <Link href="/categories/new">Add Category</Link>
        </Button>
      }
    />
  );
};

export default CategoriesPage;
