import { columns } from "./columns";
import { PageLayout } from "@/components/shared/PageLayout";
import { Button } from "@/components/ui/button";
import { Category } from "@/lib/types";
import Link from "next/link";
import { getCategories } from "@/lib/database";

async function getData(): Promise<Category[]> {
  try {
    const categories = await getCategories();
    return categories;
  } catch (error) {
    console.error('Error fetching categories:', error);
    return [];
  }
}

const CategoriesPage = async () => {
  const data = await getData();
  return (
    <PageLayout
      title="All Categories"
      columns={columns}
      data={data}
      entityName="Category"
      deleteApiBase="/api/categories"
      addEntityButton={
        <Button asChild>
          <Link href="/categories/new">Add Category</Link>
        </Button>
      }
    />
  );
};

export default CategoriesPage;
