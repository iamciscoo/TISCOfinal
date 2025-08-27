import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { getOrderById, getUserById } from '@/lib/database'
import type { Order as DbOrder, OrderItem as DbOrderItem, Address, User } from '@/lib/types'

export const dynamic = 'force-dynamic'

function formatTZS(value: number | string | null | undefined): string {
  const n = Number(value ?? 0)
  return `TZS ${n.toLocaleString()}`
}

function formatAddress(addr?: string | Address): string {
  if (!addr) return 'No shipping address'
  if (typeof addr === 'string') return addr || 'No shipping address'
  const parts = [
    addr.first_name && addr.last_name ? `${addr.first_name} ${addr.last_name}` : undefined,
    addr.company,
    addr.address_line_1,
    addr.address_line_2,
    addr.city,
    addr.state,
    addr.postal_code,
    addr.country
  ].filter(Boolean)
  return parts.join(', ')
}

export default async function OrderDetailsPage({ params }: { params: { id: string } }) {
  const id = params?.id
  let order: DbOrder | null = null
  let customer: User | null = null

  try {
    order = await getOrderById(id)
    // Prefer related user returned with the order to avoid extra query
    customer = (order as any)?.user ?? null
    // Fallback to direct fetch if relation is missing
    if (!customer && order?.user_id) {
      try { customer = await getUserById(order.user_id) } catch {}
    }
  } catch (e) {
    // swallow and render not found UI
  }

  if (!order) {
    return (
      <div className="p-6 space-y-4">
        <Link href="/orders" className="inline-flex items-center text-sm text-muted-foreground hover:underline">
          <ArrowLeft className="h-4 w-4 mr-2" /> Back to Orders
        </Link>
        <Card>
          <CardHeader>
            <CardTitle>Order Not Found</CardTitle>
            <CardDescription>We couldn't find details for this order.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  const items: DbOrderItem[] = order.order_items ?? []
  const totalAmount = Number((order as any).total_amount ?? 0)
  const shippingAmount = Number((order as any).shipping_amount ?? 0)
  const taxAmount = Number((order as any).tax_amount ?? 0)
  const currency = (order as any).currency || 'TZS'

  const customerName = customer ? [customer.first_name, customer.last_name].filter(Boolean).join(' ') : null

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Order #{String(order.id)}</h1>
          <p className="text-sm text-muted-foreground">
            Placed on {new Date(order.created_at).toLocaleString()}
          </p>
        </div>
        <Link href="/orders" className="inline-flex items-center text-sm text-muted-foreground hover:underline">
          <ArrowLeft className="h-4 w-4 mr-2" /> Back to Orders
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Status</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center gap-2">
            <Badge variant={order.status === 'cancelled' ? 'destructive' : (order.status === 'delivered' || order.status === 'shipped') ? 'default' : 'secondary'}>
              {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
            </Badge>
            <Badge variant={order.payment_status === 'paid' ? 'default' : order.payment_status === 'failed' ? 'destructive' : 'outline'}>
              {order.payment_status.charAt(0).toUpperCase() + order.payment_status.slice(1)}
            </Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Total</CardTitle>
            <CardDescription>Includes tax and shipping</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatTZS(totalAmount)}</div>
            <div className="text-sm text-muted-foreground mt-1">
              Tax: {formatTZS(taxAmount)} · Shipping: {formatTZS(shippingAmount)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Meta</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground space-y-1">
            <div>Updated: {new Date(order.updated_at).toLocaleString()}</div>
            {Boolean((order as any).tracking_number) && (
              <div>Tracking #: {(order as any).tracking_number as string}</div>
            )}
            {Boolean((order as any).payment_method) && (
              <div>Payment: {(order as any).payment_method as string}</div>
            )}
            {Boolean((order as any).order_number) && (
              <div>Order No: {(order as any).order_number as string}</div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Items</CardTitle>
            <CardDescription>Products included in this order</CardDescription>
          </CardHeader>
          <CardContent>
            {items.length === 0 ? (
              <div className="text-sm text-muted-foreground">No items found.</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead>Unit Price</TableHead>
                    <TableHead>Quantity</TableHead>
                    <TableHead>Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((it) => (
                    <TableRow key={String(it.id)}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          {it.product?.image_url ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={it.product.image_url} alt={it.product.name} className="w-12 h-12 object-cover rounded" />
                          ) : (
                            <div className="w-12 h-12 bg-muted rounded" />
                          )}
                          <div>
                            <div className="font-medium">{it.product?.name || `Product ${String(it.product_id)}`}</div>
                            <div className="text-xs text-muted-foreground">ID: {String(it.product_id)}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{formatTZS((it as any).unit_price)}</TableCell>
                      <TableCell>{it.quantity}</TableCell>
                      <TableCell>{formatTZS((it as any).total_price)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Customer</CardTitle>
              <CardDescription>Basic customer information</CardDescription>
            </CardHeader>
            <CardContent className="text-sm">
              <div className="font-medium">{customerName || 'Unknown User'}</div>
              <div className="text-muted-foreground">{customer?.email || 'No email'}</div>
              <div className="text-muted-foreground mt-1">Customer ID: {order.user_id}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Shipping Address</CardTitle>
            </CardHeader>
            <CardContent className="text-sm">
              {formatAddress(order.shipping_address as any)}
            </CardContent>
          </Card>

          {Boolean((order as any).notes) && (
            <Card>
              <CardHeader>
                <CardTitle>Notes</CardTitle>
              </CardHeader>
              <CardContent className="text-sm whitespace-pre-wrap">
                {(order as any).notes as string}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
