import { Order, columns } from "./columns";
import { PageLayout } from "@/components/shared/PageLayout";
import { getOrders } from "@/lib/database";

const getData = async (): Promise<Order[]> => {
  try {
    const orders = await getOrders();
    
    // Transform database orders to match the admin UI format
    return orders.map(order => ({
      id: order.order_number,
      customerId: order.user_id,
      customerName: order.user ? `${order.user.first_name || ''} ${order.user.last_name || ''}`.trim() || 'Unknown User' : 'Unknown User',
      customerEmail: order.user?.email || 'No email',
      total: order.total_amount,
      status: order.status,
      paymentStatus: order.payment_status,
      items: order.order_items?.length || 0,
      shippingAddress: order.shipping_address ? 
        `${order.shipping_address.address_line_1}, ${order.shipping_address.city}, ${order.shipping_address.state} ${order.shipping_address.postal_code}` :
        'No shipping address',
      createdAt: order.created_at,
      updatedAt: order.updated_at,
      // Additional database fields
      currency: order.currency,
      shipping_amount: order.shipping_amount,
      tax_amount: order.tax_amount,
      tracking_number: order.tracking_number,
      notes: order.notes
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
    />
  );
};

export default OrdersPage;
