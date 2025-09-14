import { columns } from "./columns";
import type { CartItem } from "./columns";
import { PageLayout } from "@/components/shared/PageLayout";

const getData = async (): Promise<CartItem[]> => {
  try {
    // Use relative URL for server-side fetching
    const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001'}/api/cart`, {
      cache: 'no-store',
      next: { revalidate: 0 },
      headers: {
        'Content-Type': 'application/json',
      }
    });
    
    if (!response.ok) {
      console.error(`Cart API error: ${response.status} ${response.statusText}`);
      throw new Error(`Failed to fetch cart items: ${response.statusText}`);
    }
    
    const result = await response.json();
    const cartItems = result.data || [];
    
    // Transform cart items to match admin UI format
    return cartItems.map((item: any) => {
      const product = item.products;
      const user = item.users;
      const mainImage = product?.product_images?.find((img: any) => img.is_main)?.url || 
                      product?.product_images?.[0]?.url || 
                      product?.image_url || 
                      "/circular.svg";
      
      return {
        id: item.id,
        userId: item.user_id,
        productId: item.product_id,
        quantity: item.quantity,
        createdAt: item.created_at,
        updatedAt: item.updated_at,
        // Product details
        productName: product?.name || 'Unknown Product',
        productPrice: Number(product?.price || 0),
        productImage: mainImage,
        stockQuantity: product?.stock_quantity || 0,
        // User details
        userName: user ? `${user.first_name || ''} ${user.last_name || ''}`.trim() : 'Unknown User',
        userEmail: user?.email || 'No email',
        // Calculated fields
        totalPrice: Number(product?.price || 0) * item.quantity,
        inStock: (product?.stock_quantity || 0) > 0
      };
    });
  } catch (error) {
    console.error('Error fetching cart items:', error);
    return [];
  }
};

export const dynamic = 'force-dynamic'

const CartPage = async () => {
  const data = await getData();
  return (
    <PageLayout
      title="Cart Management"
      columns={columns}
      data={data}
      entityName="Cart Item"
      deleteApiBase="/api/cart"
    />
  );
};

export default CartPage;
