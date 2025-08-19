import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
  Users, 
  Award, 
  Globe, 
  Shield, 
  Heart, 
  Truck,
  Clock,
  CheckCircle
} from 'lucide-react'
import { PageLayout, Breadcrumb } from '@/components/shared'

export default function AboutPage() {
  const breadcrumbItems = [
    { label: 'Home', href: '/' },
    { label: 'About Us' }
  ]

  return (
    <PageLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb */}
        <Breadcrumb items={breadcrumbItems} className="mb-8" />

        {/* Hero Section */}
        <section className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            About TISCO Market
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            We&apos;re more than just an online marketplace. We&apos;re your trusted partner in 
            discovering quality products, exceptional service, and unbeatable value.
          </p>
        </section>

        {/* Our Story */}
        <section className="mb-16">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-6">Our Story</h2>
              <div className="space-y-4 text-gray-600">
                <p>
                  Founded in 2020, TISCO Market began with a simple mission: to make quality 
                  products accessible to everyone, everywhere. What started as a small team 
                  with big dreams has grown into a trusted marketplace serving millions of 
                  customers worldwide.
                </p>
                <p>
                  We believe that shopping should be more than just a transaction. It should 
                  be an experience that delights, inspires, and connects people with the 
                  products they love. That&apos;s why we&apos;ve built our platform around three 
                  core principles: quality, convenience, and customer satisfaction.
                </p>
                <p>
                  Today, we partner with thousands of trusted sellers and brands to bring 
                  you an ever-expanding catalog of products across dozens of categories. 
                  From everyday essentials to unique finds, we&apos;re here to help you 
                  discover what you need, when you need it.
                </p>
              </div>
            </div>
            <div className="relative">
              <Card className="bg-blue-600 text-white">
                <CardContent className="p-8">
                  <div className="grid grid-cols-2 gap-6">
                    <div className="text-center">
                      <div className="text-3xl font-bold mb-2">2M+</div>
                      <div className="text-sm text-blue-100">Happy Customers</div>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold mb-2">10K+</div>
                      <div className="text-sm text-blue-100">Products</div>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold mb-2">500+</div>
                      <div className="text-sm text-blue-100">Trusted Sellers</div>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold mb-2">50+</div>
                      <div className="text-sm text-blue-100">Countries Served</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Our Values */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">Our Values</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                icon: Shield,
                title: 'Trust & Security',
                description: 'Your data and transactions are protected with industry-leading security measures.'
              },
              {
                icon: Heart,
                title: 'Customer First',
                description: 'Every decision we make is guided by what&apos;s best for our customers.'
              },
              {
                icon: Award,
                title: 'Quality Assurance',
                description: 'We work only with verified sellers and stand behind every product sold.'
              },
              {
                icon: Globe,
                title: 'Global Reach',
                description: 'Connecting buyers and sellers across the world with seamless experiences.'
              }
            ].map((value, index) => {
              const IconComponent = value.icon
              return (
                <Card key={index} className="text-center hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <IconComponent className="h-8 w-8 text-blue-600" />
                    </div>
                    <h3 className="font-semibold text-gray-900 mb-3">{value.title}</h3>
                    <p className="text-sm text-gray-600">{value.description}</p>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </section>

        {/* Why Choose Us */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">Why Choose TISCO Market?</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {[
              {
                icon: Truck,
                title: 'Fast & Free Shipping',
                description: 'Free shipping on orders over $50. Express options available for urgent needs.'
              },
              {
                icon: Clock,
                title: '24/7 Customer Support',
                description: 'Our dedicated support team is always ready to help, any time of day.'
              },
              {
                icon: CheckCircle,
                title: 'Easy Returns',
                description: '30-day hassle-free returns on most items. No questions asked.'
              },
              {
                icon: Users,
                title: 'Verified Reviews',
                description: 'Real reviews from real customers to help you make informed decisions.'
              }
            ].map((feature, index) => {
              const IconComponent = feature.icon
              return (
                <Card key={index} className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-6 flex items-start space-x-4">
                    <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <IconComponent className="h-6 w-6 text-green-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-2">{feature.title}</h3>
                      <p className="text-gray-600">{feature.description}</p>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </section>

        {/* Team Section */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">Meet Our Team</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                name: 'Sarah Johnson',
                role: 'CEO & Founder',
                bio: 'Passionate about creating exceptional customer experiences and building lasting relationships.',
                image: '/team/sarah.jpg'
              },
              {
                name: 'Michael Chen',
                role: 'CTO',
                bio: 'Leading our technology vision to create the most user-friendly marketplace platform.',
                image: '/team/michael.jpg'
              },
              {
                name: 'Emily Rodriguez',
                role: 'Head of Customer Success',
                bio: 'Ensuring every customer interaction exceeds expectations and builds trust.',
                image: '/team/emily.jpg'
              }
            ].map((member, index) => (
              <Card key={index} className="text-center hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="w-24 h-24 bg-gray-200 rounded-full mx-auto mb-4 flex items-center justify-center">
                    <Users className="h-12 w-12 text-gray-400" />
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-1">{member.name}</h3>
                  <p className="text-blue-600 font-medium mb-3">{member.role}</p>
                  <p className="text-sm text-gray-600">{member.bio}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* CTA Section */}
        <section className="text-center">
          <Card className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
            <CardContent className="py-12">
              <h2 className="text-3xl font-bold mb-4">Ready to Start Shopping?</h2>
              <p className="text-blue-100 mb-8 max-w-2xl mx-auto">
                Join millions of satisfied customers who trust TISCO Market for their shopping needs.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button asChild size="lg" variant="secondary">
                  <Link href="/products">Browse Products</Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="text-white border-white hover:bg-white hover:text-blue-600">
                  <Link href="/contact">Contact Us</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </section>
      </div>
    </PageLayout>
  )
}
