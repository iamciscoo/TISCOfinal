import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Receipt } from 'lucide-react'
import { getOrderById, getUserById } from '@/lib/database'

function formatTZS(value: number | string | null | undefined): string {
  const n = Number(value ?? 0)
  return `TZS ${n.toLocaleString()}`
}

export default async function PaymentDetailsPage({ params }: { params: { id: string } }) {
  const id = params?.id

  const order = await getOrderById(id)
  if (!order) {
    return (
      <div className="p-6 space-y-4">
        <Link href="/payments" className="inline-flex items-center text-sm text-muted-foreground hover:underline">
          <ArrowLeft className="h-4 w-4 mr-2" /> Back to Payments
        </Link>
        <Card>
          <CardHeader>
            <CardTitle>Payment Not Found</CardTitle>
            <CardDescription>We couldn't find details for this payment.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  const user = order.user_id ? await getUserById(order.user_id) : null

  const totalAmount = Number((order as any).total_amount ?? 0)
  const paymentMethod = (order as any).payment_method as string | undefined
  const currency = (order as any).currency || 'TZS'
  const orderNumber = (order as any).order_number as string | undefined

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Receipt className="h-6 w-6 text-muted-foreground" />
          <div>
            <h1 className="text-2xl font-bold">Payment #{String(order.id)}</h1>
            <p className="text-sm text-muted-foreground">Created on {new Date(order.created_at).toLocaleString()}</p>
          </div>
        </div>
        <Link href="/payments" className="inline-flex items-center text-sm text-muted-foreground hover:underline">
          <ArrowLeft className="h-4 w-4 mr-2" /> Back to Payments
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Amount</CardTitle>
            <CardDescription>Currency: {currency}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatTZS(totalAmount)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Status</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center gap-2">
            <Badge variant={order.payment_status === 'paid' ? 'default' : order.payment_status === 'failed' ? 'destructive' : 'secondary'}>
              {order.payment_status.charAt(0).toUpperCase() + order.payment_status.slice(1)}
            </Badge>
            {paymentMethod && (
              <span className="text-sm text-muted-foreground">· {paymentMethod}</span>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Meta</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground space-y-1">
            <div>Updated: {new Date(order.updated_at).toLocaleString()}</div>
            {orderNumber && <div>Order No: {orderNumber}</div>}
            <div>Order ID: {String(order.id)}</div>
            <Link href={`/orders/${order.id}`} className="text-primary hover:underline">View full order</Link>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Customer</CardTitle>
          </CardHeader>
          <CardContent className="text-sm">
            <div className="font-medium">{user ? [user.first_name, user.last_name].filter(Boolean).join(' ') || 'Unknown User' : 'Unknown User'}</div>
            <div className="text-muted-foreground">{user?.email || 'No email'}</div>
            <div className="text-muted-foreground mt-1">Customer ID: {order.user_id}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Notes</CardTitle>
          </CardHeader>
          <CardContent className="text-sm whitespace-pre-wrap">
            {(order as any).notes || '—'}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
