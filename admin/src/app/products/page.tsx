import { Product, columns } from "./columns";
import { PageLayout } from "@/components/shared/PageLayout";
import { getProducts } from "@/lib/database";

const getData = async (): Promise<Product[]> => {
  try {
    const products = await getProducts();
    
    // Transform database products to match the admin UI format
    return products.map(product => {
      const description = product.description || "";
      const imgs = (product as any).product_images as any[] | undefined;
      const mainFromList = imgs?.find((img) => img.is_main)?.url || imgs?.[0]?.url;
      const mainImage = mainFromList || (product as any).image_url || "/circular.svg";
      return ({
        id: product.id,
        name: product.name,
        shortDescription: description.substring(0, 60) + (description.length > 60 ? "..." : ""),
        description,
        price: Number((product as any).price ?? 0),
        sizes: ["Standard"], // Default sizes - can be enhanced later
        colors: ["Default"], // Default colors - can be enhanced later
        images: {
          "Default": mainImage
        },
        // Additional database fields
        stock_quantity: (product as any).stock_quantity,
        is_featured: !!product.is_featured,
        is_active: !!product.is_active,
        rating: (product as any).rating,
        reviews_count: (product as any).reviews_count,
        category: product.category
      })
    });
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
