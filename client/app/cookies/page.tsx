import { PageLayout } from '@/components/shared'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function CookiePolicyPage() {
  return (
    <PageLayout
      showBreadcrumb
      breadcrumbItems={[
        { label: 'Home', href: '/' },
        { label: 'Cookie Policy' },
      ]}
    >
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-3">Cookie Policy</h1>
          <p className="text-gray-600">Last updated: 29 Aug 2025</p>
        </div>

        <Card className="mb-6">
          <CardContent className="prose prose-gray max-w-none p-6">
            <p>
              TISCO Market (&quot;we&quot;, &quot;us&quot;) uses cookies and similar technologies to operate, protect, and
              improve our services. This Cookie Policy explains what cookies are, which types we use, and
              how you can manage your preferences.
            </p>
            <p className="text-sm text-gray-500">
              We aim to align with applicable requirements in the United Republic of Tanzania and relevant
              African data protection frameworks. Where consent is required for non-essential cookies, we
              will seek it via our site interfaces.
            </p>
          </CardContent>
        </Card>

        <Card className="mb-6" id="what-are-cookies">
          <CardHeader>
            <CardTitle>1. What Are Cookies?</CardTitle>
          </CardHeader>
          <CardContent className="text-gray-700 space-y-3">
            <p>
              Cookies are small text files placed on your device by a website. They are widely used to make
              websites work, improve user experiences, and provide information to site owners. Related
              technologies include pixels, SDKs, and local storage.
            </p>
          </CardContent>
        </Card>

        <Card className="mb-6" id="types">
          <CardHeader>
            <CardTitle>2. Types of Cookies We Use</CardTitle>
          </CardHeader>
          <CardContent className="text-gray-700 space-y-3">
            <ul className="list-disc pl-5 space-y-2">
              <li>
                Strictly Necessary: required for basic site functions (e.g., security, cart, navigation).
              </li>
              <li>
                Performance/Analytics: help us understand site usage and improve performance (aggregated
                metrics, page views, errors).
              </li>
              <li>
                Functional: remember your choices (e.g., language, region) to provide enhanced features.
              </li>
              <li>
                Advertising/Marketing: deliver relevant ads and measure ad performance (used only where
                applicable and in accordance with law).
              </li>
            </ul>
          </CardContent>
        </Card>

        <Card className="mb-6" id="legal-basis">
          <CardHeader>
            <CardTitle>3. Legal Basis & Consent</CardTitle>
          </CardHeader>
          <CardContent className="text-gray-700 space-y-3">
            <p>
              We use strictly necessary cookies to provide core site functionality. For non‑essential
              cookies, we rely on your consent where required by law. You can withdraw or modify your
              consent at any time via your browser settings and (where available) our site preferences.
            </p>
          </CardContent>
        </Card>

        <Card className="mb-6" id="manage">
          <CardHeader>
            <CardTitle>4. Managing Cookies</CardTitle>
          </CardHeader>
          <CardContent className="text-gray-700 space-y-3">
            <ul className="list-disc pl-5 space-y-2">
              <li>
                Browser Controls: You can block or delete cookies through your browser settings. Doing so
                may impact site functionality.
              </li>
              <li>
                Device Settings: Some devices provide additional privacy controls for app‑based tracking.
              </li>
              <li>
                Third‑party Opt‑outs: Where applicable, you may opt out of certain analytics or ad cookies
                via provider tools.
              </li>
            </ul>
          </CardContent>
        </Card>

        <Card className="mb-6" id="third-parties">
          <CardHeader>
            <CardTitle>5. Third‑Party Cookies</CardTitle>
          </CardHeader>
          <CardContent className="text-gray-700 space-y-3">
            <p>
              Some cookies are set by third parties that provide services to us (e.g., analytics providers,
              payment processors, logistics). Those third parties are responsible for their own processing
              practices. We encourage you to review their policies where relevant.
            </p>
          </CardContent>
        </Card>

        <Card className="mb-6" id="retention">
          <CardHeader>
            <CardTitle>6. Retention</CardTitle>
          </CardHeader>
          <CardContent className="text-gray-700 space-y-3">
            <p>
              Cookies may be session‑based (expire when you close your browser) or persistent (remain for a
              set period). Retention periods vary by cookie type and provider.
            </p>
          </CardContent>
        </Card>

        <Card className="mb-6" id="changes">
          <CardHeader>
            <CardTitle>7. Changes to This Policy</CardTitle>
          </CardHeader>
          <CardContent className="text-gray-700 space-y-3">
            <p>
              We may update this Cookie Policy from time to time. We will post the updated version with a
              new “Last updated” date.
            </p>
          </CardContent>
        </Card>

        <Card className="mb-2" id="contact">
          <CardHeader>
            <CardTitle>8. Contact Us</CardTitle>
          </CardHeader>
          <CardContent className="text-gray-700 space-y-2">
            <p>Email: support@tiscomarket.com</p>
            <p className="text-sm text-gray-500">This document provides general information and does not constitute legal advice.</p>
          </CardContent>
        </Card>
      </section>
    </PageLayout>
  )
}
