import { columns, type ServiceBookingRow } from "./columns";
import { PageLayout } from "@/components/shared/PageLayout";
import { getServiceBookings } from "@/lib/database";

const getData = async (): Promise<ServiceBookingRow[]> => {
  try {
    const bookings = await getServiceBookings();
    return (bookings || []).map((b: any) => {
      const fullName = [b.user?.first_name, b.user?.last_name].filter(Boolean).join(" ") || b.user?.email || "Unknown User";
      return {
        id: String(b.id),
        serviceTitle: b.service?.title || "Unknown Service",
        customerName: fullName,
        customerEmail: b.user?.email || "-",
        status: b.status || "pending",
        scheduledDate: b.scheduled_date,
        total: Number(b.total_amount ?? 0),
        createdAt: b.created_at,
      };
    });
  } catch (error) {
    console.error("Error fetching service bookings:", error);
    return [];
  }
};

const ServiceBookingsPage = async () => {
  const data = await getData();
  return (
    <PageLayout
      title="Service Bookings"
      columns={columns}
      data={data}
      entityName="Booking"
    />
  );
};

export default ServiceBookingsPage;
