import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { CheckCircle, Download, Mail, Package, ArrowRight } from 'lucide-react'

export default function CheckoutSuccessPage() {
  // In a real app, you'd get order details from URL params or API
  const orderNumber = `#ORD-${Date.now().toString().slice(-6)}`
  const estimatedDelivery = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-2xl w-full">
        {/* Success Icon */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-4">
            <CheckCircle className="h-12 w-12 text-green-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Order Confirmed!</h1>
          <p className="text-lg text-gray-600">
            Thank you for your purchase. Your order has been received and is being processed.
          </p>
        </div>

        {/* Order Details Card */}
        <Card className="mb-8">
          <CardContent className="p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-2">
                  Order Number
                </h3>
                <p className="text-2xl font-bold text-gray-900">{orderNumber}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-2">
                  Estimated Delivery
                </h3>
                <p className="text-lg font-semibold text-gray-900">{estimatedDelivery}</p>
              </div>
            </div>

            <div className="border-t pt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">What happens next?</h3>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Mail className="h-4 w-4 text-blue-600" />
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">Order Confirmation Email</h4>
                    <p className="text-sm text-gray-600">
                      You&apos;ll receive an email confirmation with your order details shortly.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Package className="h-4 w-4 text-yellow-600" />
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">Order Processing</h4>
                    <p className="text-sm text-gray-600">
                      We&apos;re preparing your items for shipment. This usually takes 1-2 business days.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Package className="h-4 w-4 text-green-600" />
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">Shipping Notification</h4>
                    <p className="text-sm text-gray-600">
                      Once shipped, you&apos;ll receive tracking information to monitor your package.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
          <Button variant="outline" className="h-12">
            <Download className="h-4 w-4 mr-2" />
            Download Receipt
          </Button>
          <Button variant="outline" className="h-12">
            <Mail className="h-4 w-4 mr-2" />
            Email Receipt
          </Button>
        </div>

        {/* Navigation */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button asChild variant="outline" className="h-12 px-8">
            <Link href="/orders">
              View Order Status
            </Link>
          </Button>
          <Button asChild className="h-12 px-8">
            <Link href="/products">
              Continue Shopping
              <ArrowRight className="h-4 w-4 ml-2" />
            </Link>
          </Button>
        </div>

        {/* Footer Note */}
        <div className="text-center mt-8 pt-8 border-t">
          <p className="text-sm text-gray-500">
            Need help? Contact our{' '}
            <Link href="/contact" className="text-blue-600 hover:underline">
              customer support team
            </Link>
            {' '}or call (555) 123-4567
          </p>
        </div>
      </div>
    </div>
  )
}
