import Link from 'next/link'
import { PageLayout } from '@/components/shared'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export default function DeliveryGuidePage() {
  return (
    <PageLayout
      showBreadcrumb
      breadcrumbItems={[
        { label: 'Home', href: '/' },
        { label: 'Delivery Guide' },
      ]}
    >
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold text-gray-900 mb-3">Delivery Guide</h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Learn how our delivery process works, estimated timelines, and what to expect
            after placing an order. This page is a placeholder and will be updated soon
            with specific regional details and carrier information.
          </p>
        </div>

        {/* Processing & Dispatch */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Processing & Dispatch</CardTitle>
          </CardHeader>
          <CardContent className="text-gray-700 space-y-3">
            <ul className="list-disc pl-5 space-y-2">
              <li>Orders are typically processed within 1–2 business days.</li>
              <li>Orders placed on weekends or holidays process on the next business day.</li>
              <li>You will receive an email confirmation once your order has been dispatched.</li>
            </ul>
          </CardContent>
        </Card>

        {/* Delivery Estimates */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Delivery Estimates</CardTitle>
          </CardHeader>
          <CardContent className="text-gray-700 space-y-3">
            <p>Estimated timeframes after dispatch (subject to change):</p>
            <ul className="list-disc pl-5 space-y-2">
              <li>Local/Metro areas: 1–3 business days</li>
              <li>Regional areas: 3–7 business days</li>
              <li>Remote areas: 7–14+ business days</li>
            </ul>
            <p className="text-sm text-gray-500">Note: Actual delivery times can vary due to carrier capacity, weather, and other factors.</p>
          </CardContent>
        </Card>

        {/* Order Updates */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Order Updates</CardTitle>
          </CardHeader>
          <CardContent className="text-gray-700 space-y-3">
            <p>
              We currently do not provide live tracking on the site. You will receive updates
              via email when your order is confirmed and when it ships. If you have questions
              about your delivery status, our team is here to help.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Button asChild className="sm:w-auto w-full">
                <Link href="/contact">Contact Support</Link>
              </Button>
              <Button asChild variant="outline" className="sm:w-auto w-full">
                <Link href="/faq">View FAQ</Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Address & Changes */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Delivery Address & Changes</CardTitle>
          </CardHeader>
          <CardContent className="text-gray-700 space-y-3">
            <ul className="list-disc pl-5 space-y-2">
              <li>Please double‑check your delivery address at checkout.</li>
              <li>If you need to update your address after placing an order, contact us as soon as possible.</li>
              <li>Once an order has been dispatched, address changes may not be possible.</li>
            </ul>
          </CardContent>
        </Card>

        {/* CTA */}
        <div className="mt-10 text-center">
          <div className="inline-flex flex-col sm:flex-row gap-3">
            <Button asChild>
              <Link href="/products">Continue Shopping</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/contact">Get Help</Link>
            </Button>
          </div>
        </div>
      </section>
    </PageLayout>
  )
}
