'use client'

import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Navbar } from '@/components/Navbar'
import { Footer } from '@/components/Footer'
import { CartSidebar } from '@/components/CartSidebar'

// Tracking removed: this page no longer collects or displays order tracking data.

// No helpers or API calls needed; tracking functionality has been removed.

export default function TrackOrderPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb */}
        <nav className="flex items-center space-x-2 text-sm text-gray-600 mb-8">
          <Link href="/" className="hover:text-blue-600">Home</Link>
          <span>/</span>
          <span className="text-gray-900">Order Updates</span>
        </nav>

        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Order Updates</h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            We currently do not offer live order tracking on the site. For delivery timelines
            and what to expect after purchase, please review our Delivery FAQs.
          </p>
        </div>

        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle>Next Steps</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-gray-700">
              • Check our Delivery FAQs for timelines, processing, and delivery information.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Button asChild className="sm:w-auto w-full">
                <Link href="/faq">View Delivery FAQs</Link>
              </Button>
              <Button asChild variant="outline" className="sm:w-auto w-full">
                <Link href="/contact">Contact Support</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <Footer />
      <CartSidebar />
    </div>
  )
}
