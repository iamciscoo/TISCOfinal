import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { CheckCircle, Mail, Package, ArrowRight, Phone, CreditCard, Clock } from 'lucide-react'

export default function CheckoutSuccessPage() {
  // In a real app, you'd get order details from URL params or API
  const orderNumber = `#ORD-${Date.now().toString().slice(-6)}`

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center px-4 py-12">
      <div className="max-w-3xl w-full">
        {/* Success Icon */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-green-400 to-green-600 rounded-full mb-4 shadow-lg">
            <CheckCircle className="h-14 w-14 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-3">Order Received!</h1>
          <p className="text-xl text-gray-600">
            Thank you for choosing TISCO. Your order has been successfully placed.
          </p>
          <p className="text-lg text-gray-500 mt-2">
            Order Number: <span className="font-bold text-gray-900">{orderNumber}</span>
          </p>
        </div>

        {/* Important Notice - Payment Details Coming */}
        <Card className="mb-6 border-2 border-blue-500 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                <Mail className="h-6 w-6 text-blue-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold text-gray-900 mb-2">Check Your Email!</h3>
                <p className="text-gray-700 mb-3">
                  We&apos;ve sent you an order confirmation email with important payment details including:
                </p>
                <ul className="space-y-2 text-gray-700">
                  <li className="flex items-center gap-2">
                    <CreditCard className="h-4 w-4 text-blue-600 flex-shrink-0" />
                    <span><strong>Bank account number</strong> for bank transfer</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-blue-600 flex-shrink-0" />
                    <span><strong>Mobile money numbers</strong> (M-Pesa, Tigo Pesa, Airtel Money)</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Package className="h-4 w-4 text-blue-600 flex-shrink-0" />
                    <span><strong>Your complete order details</strong></span>
                  </li>
                </ul>
                <p className="text-sm text-gray-600 mt-3 italic">
                  💡 If you don&apos;t see the email, please check your spam/junk folder.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* What Happens Next Card */}
        <Card className="mb-8">
          <CardContent className="p-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <Clock className="h-6 w-6 text-green-600" />
              What Happens Next?
            </h3>
            <div className="space-y-6">
              {/* Step 1 */}
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-10 h-10 bg-green-100 text-green-700 rounded-full flex items-center justify-center font-bold text-lg">
                  1
                </div>
                <div className="flex-1">
                  <h4 className="font-bold text-gray-900 text-lg mb-1">Our Team Will Contact You</h4>
                  <p className="text-gray-600">
                    Within the next <strong>24 hours</strong>, our customer service team will call or email you to confirm your order details and discuss delivery arrangements.
                  </p>
                </div>
              </div>

              {/* Step 2 */}
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-10 h-10 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center font-bold text-lg">
                  2
                </div>
                <div className="flex-1">
                  <h4 className="font-bold text-gray-900 text-lg mb-1">Choose Your Payment Method</h4>
                  <p className="text-gray-600 mb-2">
                    You can pay using any of these convenient options:
                  </p>
                  <ul className="text-sm text-gray-700 space-y-1 ml-4">
                    <li>• <strong>Bank Transfer:</strong> Transfer to our bank account (details in email)</li>
                    <li>• <strong>Mobile Money:</strong> Send via M-Pesa, Tigo Pesa, or Airtel Money</li>
                    <li>• <strong>Cash at Office:</strong> Pay when you pick up your order</li>
                  </ul>
                </div>
              </div>

              {/* Step 3 */}
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-10 h-10 bg-yellow-100 text-yellow-700 rounded-full flex items-center justify-center font-bold text-lg">
                  3
                </div>
                <div className="flex-1">
                  <h4 className="font-bold text-gray-900 text-lg mb-1">Confirm Payment</h4>
                  <p className="text-gray-600">
                    After making your payment, send us the transaction confirmation via WhatsApp, email, or phone call. We&apos;ll verify and confirm receipt.
                  </p>
                </div>
              </div>

              {/* Step 4 */}
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-10 h-10 bg-purple-100 text-purple-700 rounded-full flex items-center justify-center font-bold text-lg">
                  4
                </div>
                <div className="flex-1">
                  <h4 className="font-bold text-gray-900 text-lg mb-1">Delivery or Pickup</h4>
                  <p className="text-gray-600">
                    Once payment is confirmed, we&apos;ll arrange delivery to your address or schedule a pickup time at our office - whichever you prefer!
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Contact Information */}
        <Card className="mb-8 bg-gradient-to-r from-gray-50 to-gray-100">
          <CardContent className="p-6">
            <h3 className="font-bold text-gray-900 text-lg mb-4">Need Immediate Assistance?</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex items-center gap-3">
                <Phone className="h-5 w-5 text-green-600" />
                <div>
                  <p className="text-sm text-gray-600">Call/WhatsApp</p>
                  <p className="font-semibold text-gray-900">+255 758 787 168</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Mail className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="text-sm text-gray-600">Email</p>
                  <p className="font-semibold text-gray-900">info@tiscomarket.store</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button asChild variant="outline" className="h-12 px-8">
            <Link href="/account/orders">
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
        <div className="text-center mt-8 pt-8 border-t border-gray-300">
          <div className="bg-green-50 p-4 rounded-lg inline-block">
            <p className="text-sm text-gray-700 font-medium mb-2">
              🎉 Your order is confirmed! We&apos;ll be in touch within 24 hours.
            </p>
            <p className="text-xs text-gray-600">
              Questions? Reach us at{' '}
              <a href="mailto:info@tiscomarket.store" className="text-blue-600 hover:underline font-semibold">
                info@tiscomarket.store
              </a>
              {' '}or{' '}
              <a href="tel:+255758787168" className="text-green-600 hover:underline font-semibold">
                +255 758 787 168
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
