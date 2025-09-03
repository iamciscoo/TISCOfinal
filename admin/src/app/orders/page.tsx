import { columns } from "./columns";
import type { OrderColumn as Order } from "@/lib/ui-types";
import { PageLayout } from "@/components/shared/PageLayout";
import { getOrders } from "@/lib/database";

export const dynamic = 'force-dynamic'

const getData = async (): Promise<Order[]> => {
  try {
    const orders = await getOrders();
    
    // Transform database orders to match the admin UI format
    return orders.map(order => ({
      id: String(order.id),
      customerId: order.user_id,
      customerName: order.user ? `${order.user.first_name || ''} ${order.user.last_name || ''}`.trim() || 'Unknown User' : 'Unknown User',
      customerEmail: order.user?.email || 'No email',
      total: Number((order as any).total_amount ?? 0),
      status: order.status,
      paymentStatus: order.payment_status === 'cancelled' ? 'failed' : order.payment_status,
      items: order.order_items?.length || 0,
      shippingAddress:
        order.shipping_address
          ? (typeof order.shipping_address === 'string'
              ? order.shipping_address
              : [
                  order.shipping_address?.address_line_1,
                  order.shipping_address?.city,
                  `${order.shipping_address?.state ?? ''} ${order.shipping_address?.postal_code ?? ''}`.trim()
                ]
                .filter(Boolean)
                .join(', ') || 'No shipping address')
          : 'No shipping address',
      createdAt: order.created_at,
      updatedAt: order.updated_at,
      // Additional database fields
      currency: (order as any).currency,
      shipping_amount: Number((order as any).shipping_amount ?? 0),
      tax_amount: Number((order as any).tax_amount ?? 0),
      tracking_number: (order as any).tracking_number,
      notes: (order as any).notes
    }));
  } catch (error) {
    console.error('Error fetching orders:', error);
    return [];
  }
};

const OrdersPage = async () => {
  const data = await getData();
  return (
    <PageLayout
      title="All Orders"
      columns={columns}
      data={data}
      entityName="Order"
      deleteApiBase="/api/orders"
    />
  );
};

export default OrdersPage;
