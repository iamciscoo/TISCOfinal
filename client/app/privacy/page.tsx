import { PageLayout } from '@/components/shared'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function PrivacyPolicyPage() {
  return (
    <PageLayout
      showBreadcrumb
      breadcrumbItems={[
        { label: 'Home', href: '/' },
        { label: 'Privacy Policy' },
      ]}
    >
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-3">Privacy Policy</h1>
          <p className="text-gray-600">Last updated: 29 Aug 2025</p>
        </div>

        <Card className="mb-6">
          <CardContent className="prose prose-gray max-w-none p-6">
            <p>
              TISCO Market ("we", "us", or "our") is committed to protecting your privacy. This
              Privacy Policy explains how we collect, use, disclose, and safeguard your personal data
              when you use our website, mobile experiences, and related services (collectively, the
              "Services").
            </p>
            <p className="text-sm text-gray-500">
              This Policy is intended to align with applicable data protection laws in the United Republic
              of Tanzania (including the Personal Data Protection Act, 2022) and, where relevant to our
              operations, comparable frameworks across African states (such as South Africa’s POPIA,
              Nigeria’s NDPR, and Kenya’s Data Protection Act). Specific rights and obligations may vary
              by jurisdiction.
            </p>
          </CardContent>
        </Card>

        <Card className="mb-6" id="data-we-collect">
          <CardHeader>
            <CardTitle>1. Data We Collect</CardTitle>
          </CardHeader>
          <CardContent className="text-gray-700 space-y-3">
            <ul className="list-disc pl-5 space-y-2">
              <li>
                Account & Order Data: name, contact details, delivery address, order history, and
                communications with us.
              </li>
              <li>
                Payment Data: limited billing details and transaction references. Card processing is
                handled by secure third‑party processors; we do not store full card details.
              </li>
              <li>
                Usage & Device Data: pages viewed, referring pages, IP address, device identifiers,
                browser type, and cookies or similar technologies.
              </li>
              <li>
                Third‑party Data: from logistics partners, payment providers, analytics, and fraud
                prevention services to enable our Services.
              </li>
            </ul>
          </CardContent>
        </Card>

        <Card className="mb-6" id="lawful-bases">
          <CardHeader>
            <CardTitle>2. Lawful Bases for Processing</CardTitle>
          </CardHeader>
          <CardContent className="text-gray-700 space-y-3">
            <p>We process personal data based on one or more of the following legal bases:</p>
            <ul className="list-disc pl-5 space-y-2">
              <li>Consent (e.g., marketing communications, cookies where required).</li>
              <li>Performance of a contract (e.g., to fulfill orders, provide support).</li>
              <li>Compliance with legal obligations (e.g., tax, accounting, consumer protection).</li>
              <li>Legitimate interests (e.g., fraud prevention, service improvement, security).</li>
            </ul>
          </CardContent>
        </Card>

        <Card className="mb-6" id="how-we-use">
          <CardHeader>
            <CardTitle>3. How We Use Personal Data</CardTitle>
          </CardHeader>
          <CardContent className="text-gray-700 space-y-3">
            <ul className="list-disc pl-5 space-y-2">
              <li>Provide, maintain, and improve the Services.</li>
              <li>Process orders, payments, deliveries, and returns.</li>
              <li>Communicate about orders, updates, and service announcements.</li>
              <li>Personalize content, recommendations, and promotions.</li>
              <li>Detect, prevent, and investigate fraud or security incidents.</li>
              <li>Comply with applicable laws and enforce our Terms.</li>
            </ul>
          </CardContent>
        </Card>

        <Card className="mb-6" id="sharing">
          <CardHeader>
            <CardTitle>4. Sharing and Disclosures</CardTitle>
          </CardHeader>
          <CardContent className="text-gray-700 space-y-3">
            <p>
              We share data with trusted service providers who assist in operating our Services, such as
              payment processors, hosting, analytics, and logistics partners. These parties are required
              to handle personal data securely and only according to our instructions and applicable law.
              We may also disclose data if required by law or to protect our rights, users, or the public.
            </p>
          </CardContent>
        </Card>

        <Card className="mb-6" id="international-transfers">
          <CardHeader>
            <CardTitle>5. International Transfers</CardTitle>
          </CardHeader>
          <CardContent className="text-gray-700 space-y-3">
            <p>
              Your data may be transferred to and processed in countries outside of Tanzania or your
              country of residence. Where we do so, we implement appropriate safeguards (such as standard
              contractual clauses and due‑diligence on recipient protections) to help ensure your data is
              protected in line with applicable requirements.
            </p>
          </CardContent>
        </Card>

        <Card className="mb-6" id="rights">
          <CardHeader>
            <CardTitle>6. Your Rights</CardTitle>
          </CardHeader>
          <CardContent className="text-gray-700 space-y-3">
            <p>
              Subject to applicable law, you may have rights to access, correct, delete, or restrict
              processing of your personal data, to object to processing (including direct marketing), and
              to data portability. You may also withdraw consent at any time where processing is based on
              consent. We will respond to verified requests in accordance with legal timelines.
            </p>
            <p className="text-sm text-gray-500">
              If you have concerns about our data practices, you may contact us and, if unresolved, lodge a
              complaint with the relevant supervisory authority in your jurisdiction.
            </p>
          </CardContent>
        </Card>

        <Card className="mb-6" id="retention">
          <CardHeader>
            <CardTitle>7. Data Retention</CardTitle>
          </CardHeader>
          <CardContent className="text-gray-700 space-y-3">
            <p>
              We retain personal data only as long as necessary for the purposes set out in this Policy and
              as required by law (e.g., tax and accounting). When no longer needed, data is securely deleted
              or anonymized.
            </p>
          </CardContent>
        </Card>

        <Card className="mb-6" id="security">
          <CardHeader>
            <CardTitle>8. Security</CardTitle>
          </CardHeader>
          <CardContent className="text-gray-700 space-y-3">
            <p>
              We employ technical and organizational measures designed to protect personal data against
              loss, misuse, unauthorized access, disclosure, alteration, and destruction. No system is
              completely secure; we encourage you to use strong, unique passwords and keep your account
              credentials confidential.
            </p>
          </CardContent>
        </Card>

        <Card className="mb-6" id="children">
          <CardHeader>
            <CardTitle>9. Children’s Privacy</CardTitle>
          </CardHeader>
          <CardContent className="text-gray-700 space-y-3">
            <p>
              Our Services are not directed to children, and we do not knowingly collect personal data from
              children without appropriate consent when required by law. If you believe a child has provided
              us personal data, please contact us so we can take appropriate action.
            </p>
          </CardContent>
        </Card>

        <Card className="mb-6" id="marketing">
          <CardHeader>
            <CardTitle>10. Marketing Communications</CardTitle>
          </CardHeader>
          <CardContent className="text-gray-700 space-y-3">
            <p>
              You can opt out of marketing emails by using the unsubscribe link in our messages. Even if you
              opt out, we may still send non‑marketing communications such as order confirmations or service
              notifications.
            </p>
          </CardContent>
        </Card>

        <Card className="mb-6" id="cookies">
          <CardHeader>
            <CardTitle>11. Cookies & Tracking</CardTitle>
          </CardHeader>
          <CardContent className="text-gray-700 space-y-3">
            <p>
              We use cookies and similar technologies to operate and improve our Services. For details on the
              types of cookies we use and how to manage your preferences, please see our Cookie Policy.
            </p>
          </CardContent>
        </Card>

        <Card className="mb-6" id="changes">
          <CardHeader>
            <CardTitle>12. Changes to This Policy</CardTitle>
          </CardHeader>
          <CardContent className="text-gray-700 space-y-3">
            <p>
              We may update this Privacy Policy from time to time. We will post the updated version with a
              new “Last updated” date. Significant changes may be communicated via email or site notices.
            </p>
          </CardContent>
        </Card>

        <Card className="mb-2" id="contact">
          <CardHeader>
            <CardTitle>13. Contact Us</CardTitle>
          </CardHeader>
          <CardContent className="text-gray-700 space-y-2">
            <p>Email: support@tiscomarket.com</p>
            <p className="text-sm text-gray-500">
              Note: This Policy provides general information and does not constitute legal advice.
            </p>
          </CardContent>
        </Card>
      </section>
    </PageLayout>
  )
}
