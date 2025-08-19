import { Product, columns } from "./columns";
import { PageLayout } from "@/components/shared/PageLayout";
import { getProducts } from "@/lib/database";

const getData = async (): Promise<Product[]> => {
  try {
    const products = await getProducts();
    
    // Transform database products to match the admin UI format
    return products.map(product => ({
      id: product.id,
      name: product.name,
      shortDescription: product.description.substring(0, 60) + (product.description.length > 60 ? "..." : ""),
      description: product.description,
      price: product.price,
      sizes: ["Standard"], // Default sizes - can be enhanced later
      colors: ["Default"], // Default colors - can be enhanced later
      images: {
        "Default": product.image_url || "/products/default.png"
      },
      // Additional database fields
      stock_quantity: product.stock_quantity,
      is_featured: product.is_featured,
      is_active: product.is_active,
      rating: product.rating,
      reviews_count: product.reviews_count,
      category: product.category
    }));
  } catch (error) {
    console.error('Error fetching products:', error);
    return [];
  }
};

const ProductsPage = async () => {
  const data = await getData();
  return (
    <PageLayout
      title="All Products"
      columns={columns}
      data={data}
      entityName="Product"
    />
  );
};

export default ProductsPage;
