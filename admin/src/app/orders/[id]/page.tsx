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

export default async function OrderDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
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
    <div className="container mx-auto px-4 sm:px-6 py-4 sm:py-6 space-y-4 sm:space-y-6">
      {/* Mobile-first header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <Link href="/orders" className="inline-flex items-center text-sm text-muted-foreground hover:underline sm:hidden">
              <ArrowLeft className="h-4 w-4 mr-1" /> Back
            </Link>
          </div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold truncate">
            Order #{String(order.id).slice(0, 8)}...
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Placed on {new Date(order.created_at).toLocaleDateString()}
          </p>
        </div>
        <Link href="/orders" className="hidden sm:inline-flex items-center text-sm text-muted-foreground hover:underline">
          <ArrowLeft className="h-4 w-4 mr-2" /> Back to Orders
        </Link>
      </div>

      {/* Mobile-optimized status cards */}
      <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Status</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap items-center gap-2">
            <Badge variant={order.status === 'cancelled' ? 'destructive' : (order.status === 'delivered' || order.status === 'shipped') ? 'default' : 'secondary'} className="text-xs">
              {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
            </Badge>
            <Badge variant={order.payment_status === 'paid' ? 'default' : order.payment_status === 'failed' ? 'destructive' : 'outline'} className="text-xs">
              {order.payment_status.charAt(0).toUpperCase() + order.payment_status.slice(1)}
            </Badge>
          </CardContent>
        </Card>

        <Card className="sm:col-span-1 lg:col-span-1">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total</CardTitle>
            <CardDescription className="text-xs">Includes tax and shipping</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-lg sm:text-xl lg:text-2xl font-bold">{formatTZS(totalAmount)}</div>
            <div className="text-xs text-muted-foreground mt-1">
              Tax: {formatTZS(taxAmount)} · Shipping: {formatTZS(shippingAmount)}
            </div>
          </CardContent>
        </Card>

        <Card className="sm:col-span-2 lg:col-span-1">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Meta</CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground space-y-1">
            <div>Updated: {new Date(order.updated_at).toLocaleDateString()}</div>
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

      {/* Mobile-optimized items and details */}
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base sm:text-lg">Items</CardTitle>
            <CardDescription className="text-xs sm:text-sm">Products included in this order</CardDescription>
          </CardHeader>
          <CardContent>
            {items.length === 0 ? (
              <div className="text-sm text-muted-foreground">No items found.</div>
            ) : (
              <div className="space-y-3">
                {/* Mobile: Card layout, Desktop: Table */}
                <div className="block sm:hidden space-y-3">
                  {items.map((it) => {
                    const product = (it as any).products || (it as any).product
                    const imageUrl = product?.image_url
                    const productName = product?.name
                    const unitPrice = (it as any).price || 0
                    const total = unitPrice * (it.quantity || 0)
                    
                    return (
                      <div key={String(it.id)} className="border rounded-lg p-3 space-y-2">
                        <div className="flex items-start gap-3">
                          {imageUrl ? (
                            <img src={imageUrl} alt={productName || 'Product'} className="w-12 h-12 object-cover rounded flex-shrink-0" />
                          ) : (
                            <div className="w-12 h-12 bg-muted rounded flex-shrink-0" />
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-sm truncate">{productName || `Product ${String(it.product_id)}`}</div>
                            <div className="text-xs text-muted-foreground">ID: {String(it.product_id)}</div>
                          </div>
                        </div>
                        <div className="grid grid-cols-3 gap-2 text-xs">
                          <div>
                            <span className="text-muted-foreground">Price:</span>
                            <div className="font-medium">{formatTZS(unitPrice)}</div>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Qty:</span>
                            <div className="font-medium">{it.quantity}</div>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Total:</span>
                            <div className="font-medium">{formatTZS(total)}</div>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
                
                {/* Desktop: Table layout */}
                <div className="hidden sm:block">
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
                      {items.map((it) => {
                        const product = (it as any).products || (it as any).product
                        const imageUrl = product?.image_url
                        const productName = product?.name
                        
                        return (
                          <TableRow key={String(it.id)}>
                            <TableCell>
                              <div className="flex items-center gap-3">
                                {imageUrl ? (
                                  <img src={imageUrl} alt={productName || 'Product'} className="w-12 h-12 object-cover rounded" />
                                ) : (
                                  <div className="w-12 h-12 bg-muted rounded" />
                                )}
                                <div>
                                  <div className="font-medium">{productName || `Product ${String(it.product_id)}`}</div>
                                  <div className="text-xs text-muted-foreground">ID: {String(it.product_id)}</div>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>{formatTZS((it as any).price)}</TableCell>
                            <TableCell>{it.quantity}</TableCell>
                            <TableCell>{formatTZS(((it as any).price || 0) * (it.quantity || 0))}</TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="space-y-3 sm:space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm sm:text-base">Customer</CardTitle>
              <CardDescription className="text-xs sm:text-sm">Basic customer information</CardDescription>
            </CardHeader>
            <CardContent className="text-xs sm:text-sm space-y-1">
              <div className="font-medium">{customerName || 'Unknown User'}</div>
              <div className="text-muted-foreground break-all">{customer?.email || 'No email'}</div>
              <div className="text-muted-foreground mt-1">ID: {String(order.user_id).slice(0, 8)}...</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm sm:text-base">Shipping Address</CardTitle>
            </CardHeader>
            <CardContent className="text-xs sm:text-sm">
              <div className="whitespace-pre-wrap break-words">
                {formatAddress(order.shipping_address as any)}
              </div>
            </CardContent>
          </Card>

          {Boolean((order as any).notes) && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm sm:text-base">Notes</CardTitle>
              </CardHeader>
              <CardContent className="text-xs sm:text-sm whitespace-pre-wrap break-words">
                {(order as any).notes as string}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
