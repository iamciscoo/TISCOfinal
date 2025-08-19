import { Category, columns } from "./columns";
import { PageLayout } from "@/components/shared/PageLayout";

const getData = async (): Promise<Category[]> => {
  return [
    {
      id: "electronics",
      name: "Electronics",
      description: "Latest gadgets and electronic devices",
      productCount: 245,
      isActive: true,
      createdAt: "2024-01-15",
    },
    {
      id: "clothing",
      name: "Clothing & Fashion",
      description: "Trendy apparel for men, women, and kids",
      productCount: 532,
      isActive: true,
      createdAt: "2024-01-10",
    },
    {
      id: "home-garden",
      name: "Home & Garden",
      description: "Everything for your home and garden",
      productCount: 189,
      isActive: true,
      createdAt: "2024-01-08",
    },
    {
      id: "sports",
      name: "Sports & Fitness",
      description: "Gear for all your athletic pursuits",
      productCount: 156,
      isActive: true,
      createdAt: "2024-01-12",
    },
    {
      id: "automotive",
      name: "Automotive",
      description: "Car accessories and automotive parts",
      productCount: 98,
      isActive: true,
      createdAt: "2024-01-20",
    },
    {
      id: "books",
      name: "Books & Media",
      description: "Books, movies, music, and more",
      productCount: 234,
      isActive: true,
      createdAt: "2024-01-05",
    },
    {
      id: "gaming",
      name: "Gaming",
      description: "Video games and gaming accessories",
      productCount: 167,
      isActive: false,
      createdAt: "2024-01-25",
    },
    {
      id: "beauty",
      name: "Beauty & Personal Care",
      description: "Cosmetics and personal care products",
      productCount: 298,
      isActive: true,
      createdAt: "2024-01-18",
    }
  ];
};

const CategoriesPage = async () => {
  const data = await getData();
  return (
    <PageLayout
      title="All Categories"
      columns={columns}
      data={data}
      entityName="Category"
    />
  );
};

export default CategoriesPage;
