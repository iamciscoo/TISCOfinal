import { columns, type ServiceBookingRow } from "./columns";
import { PageLayout } from "@/components/shared/PageLayout";
import { getServiceBookings } from "@/lib/database";

const getData = async (): Promise<ServiceBookingRow[]> => {
  try {
    const bookings = await getServiceBookings();
    return (bookings || []).map((b: any) => {
      const fullName = [b.user?.first_name, b.user?.last_name].filter(Boolean).join(" ") || b.user?.email || "Unknown User";
      // Prefer explicit scheduled_date if present; otherwise fall back to preferred date+time
      let scheduledISO: string | undefined = b.scheduled_date || undefined;
      if (!scheduledISO && b.preferred_date && b.preferred_time) {
        const date = String(b.preferred_date).trim();
        const time = String(b.preferred_time).trim();
        // Build an ISO-like string; columns renderer will format with toLocaleString()
        scheduledISO = `${date}T${time.length >= 5 ? time.slice(0,5) : time}`;
      }
      return {
        id: String(b.id),
        serviceTitle: b.services?.title || "Unknown Service",
        customerName: fullName,
        customerEmail: b.user?.email || "-",
        status: b.status || "pending",
        payment_status: b.payment_status,
        scheduledDate: scheduledISO,
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
      deleteApiBase="/api/service-bookings"
    />
  );
};

export default ServiceBookingsPage;
