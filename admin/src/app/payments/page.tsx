import { Payment, columns } from "./columns";
import { PageLayout } from "@/components/shared/PageLayout";
import { getOrders, getUsersByIds } from "@/lib/database";

const getData = async (): Promise<Payment[]> => {
  try {
    const orders = await getOrders();
    const userIds = Array.from(new Set(orders.map((o) => o.user_id).filter(Boolean))) as string[];
    let usersMap: Record<string, { first_name?: string; last_name?: string; email?: string }> = {};
    try {
      usersMap = await getUsersByIds(userIds);
    } catch (err) {
      // Log but don't fail payments list if users lookup fails
      console.error('Error fetching users for payments:', err);
    }

    return orders.map((o) => {
      const u = usersMap[String(o.user_id)] as any;
      const fullName = u ? `${u.first_name || ''} ${u.last_name || ''}`.trim() : '';
      return {
        id: String(o.id),
        amount: Number((o as any).total_amount ?? 0),
        status: (o.payment_status as Payment['status']) || 'pending',
        fullName: fullName || 'Unknown User',
        userId: o.user_id,
        email: (u?.email as string) || 'No email',
      } as Payment;
    });
  } catch (e) {
    console.error('Error loading payments:', e)
    return []
  }
};

const PaymentsPage = async () => {
  const data = await getData();
  return (
    <PageLayout
      title="All Payments"
      columns={columns}
      data={data}
      entityName="Payment"
      deleteApiBase="/api/orders"
    />
  );
};

export default PaymentsPage;
