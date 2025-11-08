import { notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { 
  ArrowLeft, 
  Calendar, 
  Clock, 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  CreditCard,
  FileText,
  CheckCircle,
  XCircle,
  AlertCircle,
  Download
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { supabase } from "@/lib/supabase";
import { formatToEAT } from "@/lib/utils";
import DownloadReceiptButton from "./DownloadReceiptButton";

interface BookingDetailsData {
  booking: {
    id: string;
    service_type: string;
    description?: string;
    status: string;
    payment_status?: string;
    total_amount: number;
    preferred_date?: string;
    preferred_time?: string;
    contact_email: string;
    contact_phone?: string;
    customer_name: string;
    notes?: string;
    created_at: string;
    updated_at: string;
    services: {
      id: string;
      title: string;
      description: string;
      features: string[];
      duration: string;
      image?: string;
      gallery?: string[];
      created_at: string;
    } | null;
    users: {
      id: string;
      email: string;
      first_name?: string;
      last_name?: string;
      phone?: string;
      address_line_1?: string;
      address_line_2?: string;
      city?: string;
      postal_code?: string;
      country?: string;
      created_at: string;
    };
  };
  serviceCosts: {
    id: string;
    service_fee: number;
    discount: number;
    currency: string;
    subtotal: number;
    total: number;
    notes: string | null;
    items: Array<{
      id: string;
      name: string;
      unit_price: number;
      quantity: number;
      unit: string;
    }>;
  } | null;
};

async function getBookingDetails(id: string): Promise<BookingDetailsData | null> {
  try {
    // Fetch base booking first
    const { data: base, error: baseErr } = await supabase
      .from('service_bookings')
      .select(`
        id, service_id, user_id, service_type, description, preferred_date, preferred_time,
        contact_email, contact_phone, customer_name, status, notes, created_at, updated_at,
        total_amount, payment_status
      `)
      .eq('id', id)
      .maybeSingle();

    if (baseErr) {
      console.error('Booking fetch error:', {
        code: (baseErr as any)?.code,
        message: (baseErr as any)?.message,
        details: (baseErr as any)?.details,
      });
      return null;
    }

    if (!base) {
      console.warn('Booking not found:', id);
      return null;
    }

    // Fetch related service and user separately (more reliable than FK embeds)
    const [{ data: svc }, { data: usr }] = await Promise.all([
      supabase.from('services').select('id,title,description,features,duration,image,gallery,created_at,updated_at').eq('id', base.service_id).maybeSingle(),
      supabase.from('users').select('id,email,first_name,last_name,phone,address_line_1,address_line_2,city,state,postal_code,country,created_at').eq('id', base.user_id).maybeSingle(),
    ]);

    // Compose booking object
    const booking: any = {
      ...base,
      services: svc || null,
      users: usr || null
    };

    // Fetch any service costs associated with this booking
    const { data: serviceCosts, error: costsError } = await supabase
      .from("service_booking_costs")
      .select(`
        id,
        service_fee,
        discount,
        currency,
        subtotal,
        total,
        notes,
        service_booking_cost_items(
          id,
          name,
          unit_price,
          quantity,
          unit
        )
      `)
      .eq("booking_id", id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (costsError) {
      console.error("Service costs fetch error:", costsError);
    }

    // Normalize serviceCosts data structure
    let normalizedServiceCosts = null;
    if (!costsError && serviceCosts) {
      normalizedServiceCosts = {
        id: serviceCosts.id,
        service_fee: serviceCosts.service_fee || 0,
        discount: serviceCosts.discount || 0,
        currency: serviceCosts.currency || 'TZS',
        subtotal: serviceCosts.subtotal || 0,
        total: serviceCosts.total || 0,
        notes: serviceCosts.notes || null,
        items: Array.isArray(serviceCosts.service_booking_cost_items) 
          ? serviceCosts.service_booking_cost_items.map(item => ({
              id: item.id,
              name: item.name,
              unit_price: item.unit_price,
              quantity: item.quantity,
              unit: item.unit
            }))
          : []
      };

      console.log('Admin: Service costs loaded for booking:', {
        bookingId: id,
        hasServiceCosts: true,
        itemsCount: normalizedServiceCosts.items.length,
        subtotal: normalizedServiceCosts.subtotal,
        serviceFee: normalizedServiceCosts.service_fee,
        discount: normalizedServiceCosts.discount,
        total: normalizedServiceCosts.total
      });
    } else {
      console.log('Admin: No service costs found for booking:', id);
    }

    return {
      booking: {
        ...booking,
        services: booking.services,
        users: booking.users
      },
      serviceCosts: normalizedServiceCosts
    };
  } catch (error) {
    console.error("Error fetching booking details:", error);
    return null;
  }
}

function getStatusIcon(status: string) {
  switch (status) {
    case 'completed':
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    case 'cancelled':
      return <XCircle className="h-4 w-4 text-red-500" />;
    case 'in_progress':
      return <AlertCircle className="h-4 w-4 text-blue-500" />;
    default:
      return <Clock className="h-4 w-4 text-yellow-500" />;
  }
}

function formatTZS(value: number) {
  if (isNaN(value)) return "TZS 0";
  return `TZS ${Math.round(value).toLocaleString()}`;
}

export default async function BookingDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = await params;
  const data = await getBookingDetails(resolvedParams.id);

  if (!data) {
    notFound();
  }

  const { booking, serviceCosts } = data;
  const customer = booking.users;
  const service = booking.services;

  const fullName = [customer.first_name, customer.last_name].filter(Boolean).join(" ") || customer.email;
  const customerAddress = [
    customer.address_line_1,
    customer.address_line_2,
    customer.city,
    customer.postal_code,
    customer.country
  ].filter(Boolean).join(", ");

  const scheduledDateTime = booking.preferred_date && booking.preferred_time ? 
    `${booking.preferred_date}T${booking.preferred_time}` : null;

  const totalWithCosts = serviceCosts ? serviceCosts.total : booking.total_amount;

  return (
    <div className="space-y-4 sm:space-y-6 p-3 sm:p-6">
      {/* Header */}
      <div className="space-y-3 sm:space-y-4">
        <Button variant="outline" size="sm" asChild className="w-fit">
          <Link href="/service-bookings">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Service Bookings
          </Link>
        </Button>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="min-w-0 flex-1">
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold">Booking Details</h1>
            <p className="text-xs sm:text-sm text-muted-foreground truncate" title={booking.id}>ID: {booking.id}</p>
          </div>
          <div className="flex gap-2 shrink-0">
            {booking.payment_status === 'paid' && (
              <DownloadReceiptButton 
                booking={booking} 
                serviceCosts={serviceCosts} 
              />
            )}
            <Button variant="outline" asChild className="min-h-[44px] sm:min-h-[36px]">
              <Link href={`/service-bookings/${booking.id}`}>
                Edit Booking
              </Link>
            </Button>
          </div>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Booking Overview */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Booking Overview
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="font-medium">Status:</span>
              <div className="flex items-center gap-2">
                {getStatusIcon(booking.status)}
                <Badge variant={booking.status === 'completed' ? 'default' : 
                              booking.status === 'cancelled' ? 'destructive' : 'secondary'}>
                  {booking.status.replace(/_/g, ' ')}
                </Badge>
              </div>
            </div>

            {booking.payment_status && (
              <div className="flex items-center justify-between">
                <span className="font-medium">Payment:</span>
                <Badge variant={booking.payment_status === 'paid' ? 'default' : 'secondary'}>
                  {booking.payment_status}
                </Badge>
              </div>
            )}

            <div className="flex items-center justify-between">
              <span className="font-medium">Total Amount:</span>
              <span className="font-bold text-lg">{formatTZS(totalWithCosts)}</span>
            </div>

            {scheduledDateTime && (
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">Scheduled:</span>
                <span>{formatToEAT(scheduledDateTime)}</span>
              </div>
            )}

            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">Created:</span>
              <span>{formatToEAT(booking.created_at)}</span>
            </div>

            {booking.notes && (
              <div>
                <span className="font-medium">Notes:</span>
                <p className="text-sm text-muted-foreground mt-1">{booking.notes}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Customer Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Customer Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <span className="font-medium">Name:</span>
              <p>{fullName}</p>
            </div>

            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">Email:</span>
              <a href={`mailto:${customer.email}`} className="text-blue-600 hover:underline">
                {customer.email}
              </a>
            </div>

            {customer.phone && (
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">Phone:</span>
                <a href={`tel:${customer.phone}`} className="text-blue-600 hover:underline">
                  {customer.phone}
                </a>
              </div>
            )}

            {customerAddress && (
              <div className="flex items-start gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div>
                  <span className="font-medium">Address:</span>
                  <p className="text-sm text-muted-foreground">{customerAddress}</p>
                </div>
              </div>
            )}

            <div>
              <span className="font-medium">Customer Since:</span>
              <p className="text-sm text-muted-foreground">
                {formatToEAT(customer.created_at, { includeTime: false, dateStyle: 'medium' })}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Service Details */}
      {service && (
        <Card>
          <CardHeader>
            <CardTitle>{service.title}</CardTitle>
            <p className="text-sm text-muted-foreground">Service Details & Description</p>
          </CardHeader>
          <CardContent className="space-y-4">
            {service.image && (
              <div className="aspect-video relative max-w-md bg-gray-100 rounded-lg overflow-hidden">
                <Image
                  src={service.image}
                  alt={service.title}
                  fill
                  className="object-cover"
                />
              </div>
            )}

            <div>
              <h4 className="font-medium mb-2">Description</h4>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {booking.description || service.description}
              </p>
            </div>

            {service.duration && (
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">Duration:</span>
                <span>{service.duration}</span>
              </div>
            )}

            {service.features && service.features.length > 0 && (
              <div>
                <h4 className="font-medium mb-2">Service Features</h4>
                <ul className="grid gap-2 sm:grid-cols-2">
                  {service.features.map((feature, index) => (
                    <li key={index} className="flex items-center gap-2 text-sm">
                      <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {service.gallery && service.gallery.length > 0 && (
              <div>
                <h4 className="font-medium mb-2">Gallery</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {service.gallery.slice(0, 8).map((image, index) => (
                    <div key={index} className="aspect-square relative bg-gray-100 rounded-lg overflow-hidden">
                      <Image
                        src={image}
                        alt={`${service.title} gallery ${index + 1}`}
                        fill
                        className="object-cover"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Service Costs Breakdown */}
      {serviceCosts && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Cost Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Items */}
              {serviceCosts.items && serviceCosts.items.length > 0 ? (
                <div className="space-y-3">
                  <h4 className="font-medium text-sm text-gray-700">Items</h4>
                  <div className="space-y-2">
                    {serviceCosts.items.map((item) => (
                      <div key={item.id} className="flex justify-between items-center text-sm">
                        <span className="text-gray-600">
                          {item.name} ({item.quantity} {item.unit})
                        </span>
                        <span>{formatTZS(item.unit_price * item.quantity)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <h4 className="font-medium text-sm text-gray-700">Items</h4>
                  <p className="text-sm text-gray-500 italic">No items yet. Add materials/resources used.</p>
                </div>
              )}

              {/* Cost Summary */}
              <div className="bg-gray-50 rounded-lg p-3 space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Subtotal</span>
                  <span>{formatTZS(serviceCosts.subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>+ Service Fee</span>
                  <span>{formatTZS(serviceCosts.service_fee)}</span>
                </div>
                {serviceCosts.discount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span>- Discount</span>
                    <span>{formatTZS(serviceCosts.discount)}</span>
                  </div>
                )}
                <Separator />
                <div className="flex justify-between font-bold">
                  <span>Total</span>
                  <span>{formatTZS(serviceCosts.total)}</span>
                </div>
              </div>

              {/* Notes */}
              {serviceCosts.notes && (
                <div className="space-y-2">
                  <h4 className="font-medium text-sm text-gray-700">Notes</h4>
                  <p className="text-sm text-gray-600 bg-gray-50 p-2 rounded">
                    {serviceCosts.notes}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
