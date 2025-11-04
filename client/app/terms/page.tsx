import Link from 'next/link'
import { PageLayout } from '@/components/shared'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function TermsOfServicePage() {
  return (
    <PageLayout
      showBreadcrumb
      breadcrumbItems={[
        { label: 'Home', href: '/' },
        { label: 'Terms of Service' },
      ]}
    >
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-3">Terms of Service</h1>
          <p className="text-gray-600">Last updated: 29 Aug 2025</p>
        </div>

        <Card className="mb-6">
          <CardContent className="prose prose-gray max-w-none p-6">
            <p>
              Welcome to TISCO Market. By accessing or using our website and
              services (the &quot;Services&quot;), you agree to be bound by these Terms of Service (the &quot;Terms&quot;).
              If you do not agree to these Terms, please do not use the Services.
            </p>
            <p className="text-sm text-gray-500">
              These Terms are intended to align with applicable laws in the United Republic of Tanzania and,
              where relevant to our operations, comparable frameworks across African states. Specific rights
              and obligations may vary by jurisdiction.
            </p>
          </CardContent>
        </Card>

        <Card className="mb-6" id="eligibility">
          <CardHeader>
            <CardTitle>1. Eligibility & Accounts</CardTitle>
          </CardHeader>
          <CardContent className="text-gray-700 space-y-3">
            <ul className="list-disc pl-5 space-y-2">
              <li>You must be at least the age of majority in your jurisdiction to use the Services.</li>
              <li>You are responsible for maintaining the confidentiality of your account credentials.</li>
              <li>You must provide accurate, current, and complete information when creating an account.</li>
            </ul>
          </CardContent>
        </Card>

        <Card className="mb-6" id="orders-payments">
          <CardHeader>
            <CardTitle>2. Orders, Pricing & Payments</CardTitle>
          </CardHeader>
          <CardContent className="text-gray-700 space-y-3">
            <ul className="list-disc pl-5 space-y-2">
              <li>All orders are subject to acceptance and availability.</li>
              <li>Prices, promotions, and availability are subject to change without notice.</li>
              <li>
                Payments are processed by secure third‑party providers. You authorize us to charge your
                selected payment method for your orders.
              </li>
              <li>We reserve the right to cancel or refuse any order for suspected fraud or misuse.</li>
            </ul>
          </CardContent>
        </Card>

        <Card className="mb-6" id="shipping-returns">
          <CardHeader>
            <CardTitle>3. Shipping, Delivery & Returns</CardTitle>
          </CardHeader>
          <CardContent className="text-gray-700 space-y-3">
            <p>
              Delivery timelines and return windows are described on our platform. Please review our
              Delivery Guide and Returns information where provided. Your statutory consumer rights under
              applicable law remain unaffected.
            </p>
            <div>
              <Link href="/delivery-guide" className="text-blue-600 hover:underline">Delivery Guide</Link>
            </div>
          </CardContent>
        </Card>

        <Card className="mb-6" id="acceptable-use">
          <CardHeader>
            <CardTitle>4. Acceptable Use</CardTitle>
          </CardHeader>
          <CardContent className="text-gray-700 space-y-3">
            <ul className="list-disc pl-5 space-y-2">
              <li>Do not use the Services for any unlawful purpose or in violation of any law.</li>
              <li>Do not interfere with or disrupt the integrity, security, or performance of the Services.</li>
              <li>Do not misuse reviews, ratings, or communications features.</li>
            </ul>
          </CardContent>
        </Card>

        <Card className="mb-6" id="content-ip">
          <CardHeader>
            <CardTitle>5. Content & Intellectual Property</CardTitle>
          </CardHeader>
          <CardContent className="text-gray-700 space-y-3">
            <p>
              All content on the Services, including text, graphics, logos, and software, is owned by or
              licensed to us and protected by applicable intellectual property laws. You may not copy,
              reproduce, or distribute content without prior written permission.
            </p>
          </CardContent>
        </Card>

        <Card className="mb-6" id="privacy">
          <CardHeader>
            <CardTitle>6. Privacy & Data Protection</CardTitle>
          </CardHeader>
          <CardContent className="text-gray-700 space-y-3">
            <p>
              Your privacy is important to us. Our processing of personal data aligns with applicable data
              protection laws, including Tanzania’s PDPA 2022 and comparable African frameworks. Please see
              our Privacy Policy for details on how we collect, use, and safeguard your data.
            </p>
            <div>
              <Link href="/privacy" className="text-blue-600 hover:underline">Privacy Policy</Link>
            </div>
          </CardContent>
        </Card>

        <Card className="mb-6" id="disclaimers">
          <CardHeader>
            <CardTitle>7. Disclaimers</CardTitle>
          </CardHeader>
          <CardContent className="text-gray-700 space-y-3">
            <p>
              The Services are provided on an &quot;as is&quot; and &quot;as available&quot; basis. To the fullest extent
              permitted by law, we disclaim all warranties, express or implied, including merchantability,
              fitness for a particular purpose, and non‑infringement.
            </p>
          </CardContent>
        </Card>

        <Card className="mb-6" id="liability">
          <CardHeader>
            <CardTitle>8. Limitation of Liability</CardTitle>
          </CardHeader>
          <CardContent className="text-gray-700 space-y-3">
            <p>
              To the maximum extent permitted by law, we shall not be liable for any indirect, incidental,
              special, consequential, or punitive damages, or any loss of profits or revenues, arising from
              your use of the Services.
            </p>
          </CardContent>
        </Card>

        <Card className="mb-6" id="indemnity">
          <CardHeader>
            <CardTitle>9. Indemnity</CardTitle>
          </CardHeader>
          <CardContent className="text-gray-700 space-y-3">
            <p>
              You agree to indemnify and hold harmless TISCO Market and its affiliates from any claims,
              liabilities, damages, and expenses arising out of your misuse of the Services or violation of
              these Terms.
            </p>
          </CardContent>
        </Card>

        <Card className="mb-6" id="law">
          <CardHeader>
            <CardTitle>10. Governing Law & Jurisdiction</CardTitle>
          </CardHeader>
          <CardContent className="text-gray-700 space-y-3">
            <p>
              These Terms are governed by the laws of the United Republic of Tanzania. Courts located in
              Tanzania will have exclusive jurisdiction over disputes arising from or relating to these
              Terms or the Services, unless otherwise required by applicable consumer protection laws.
            </p>
          </CardContent>
        </Card>

        <Card className="mb-6" id="changes">
          <CardHeader>
            <CardTitle>11. Changes to the Terms</CardTitle>
          </CardHeader>
          <CardContent className="text-gray-700 space-y-3">
            <p>
              We may update these Terms from time to time. The updated version will be posted with a new
              “Last updated” date. Continued use of the Services constitutes acceptance of the updated Terms.
            </p>
          </CardContent>
        </Card>

        <Card className="mb-2" id="contact">
          <CardHeader>
            <CardTitle>12. Contact Us</CardTitle>
          </CardHeader>
          <CardContent className="text-gray-700 space-y-2">
            <p>Email: support@tiscomarket.store</p>
            <p className="text-sm text-gray-500">This document provides general information and does not constitute legal advice.</p>
          </CardContent>
        </Card>
      </section>
    </PageLayout>
  )
}
