import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { MobileSlider } from '@/components/ui/mobile-slider'
import { 
  Users, 
  Award, 
  Globe, 
  Shield, 
  Heart, 
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        {/* Breadcrumb */}
        <Breadcrumb items={breadcrumbItems} className="mb-8" />

        {/* Hero Section */}
        <section className="text-center mb-12 sm:mb-16">
          <div className="inline-flex items-center px-3 py-1 rounded-full bg-gray-100 text-gray-700 text-sm mb-3 sm:mb-4">
            Founded in 2025
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 mb-4 sm:mb-6">
            About TISCO Market
          </h1>
          <p className="text-lg sm:text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed px-2">
            Our mission is simple: help people get what they need quickly and at a reasonable price —
            without unnecessary waste.
          </p>
        </section>

        {/* Our Story */}
        <section className="mb-12 sm:mb-16">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-6">Our Story</h2>
              <div className="space-y-4 text-gray-600">
                <p>
                  Founded in 2025, TISCO Market was created to help people get what they need
                  quickly and at a reasonable price — without unnecessary waste. 
                </p>
                <p>
                  We focus on the essentials: clear information, fair pricing, and reliable delivery.
                  By simplifying choices and streamlining operations, we reduce friction for customers
                  and avoid waste across the journey.
                </p>
                <p>
                  As we grow, we&apos;re building responsibly — prioritizing trust, quality, and long‑term
                  value for shoppers and partners.
                </p>
              </div>
            </div>
            <div className="relative">
              <Card className="bg-white border">
                <CardContent className="p-8">
                  <div className="space-y-5">
                    <div className="flex items-start gap-3">
                      <CheckCircle className="h-5 w-5 text-gray-700 mt-0.5" />
                      <div>
                        <h3 className="font-semibold text-gray-900">Speed without waste</h3>
                        <p className="text-sm text-gray-600">Fast browsing, fast checkout, and reliable delivery — without unnecessary steps.</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Shield className="h-5 w-5 text-gray-700 mt-0.5" />
                      <div>
                        <h3 className="font-semibold text-gray-900">Fair, transparent pricing</h3>
                        <p className="text-sm text-gray-600">Clear prices and no surprises.</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Award className="h-5 w-5 text-gray-700 mt-0.5" />
                      <div>
                        <h3 className="font-semibold text-gray-900">Quality you can trust</h3>
                        <p className="text-sm text-gray-600">Products and partners we stand behind.</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Our Values */}
        <section className="mb-12 sm:mb-16">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 text-center mb-8 sm:mb-12">Our Values</h2>
          
          {/* Desktop Grid */}
          <div className="hidden md:grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
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
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <IconComponent className="h-8 w-8 text-gray-700" />
                    </div>
                    <h3 className="font-semibold text-gray-900 mb-3">{value.title}</h3>
                    <p className="text-sm text-gray-600">{value.description}</p>
                  </CardContent>
                </Card>
              )
            })}
          </div>

          {/* Mobile Slider */}
          <div className="md:hidden">
            <MobileSlider itemsPerView={1} showDots={true} showArrows={true}>
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
                      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <IconComponent className="h-8 w-8 text-gray-700" />
                      </div>
                      <h3 className="font-semibold text-gray-900 mb-3">{value.title}</h3>
                      <p className="text-sm text-gray-600">{value.description}</p>
                    </CardContent>
                  </Card>
                )
              })}
            </MobileSlider>
          </div>
        </section>

        {/* Why Choose Us */}
        <section className="mb-12 sm:mb-16">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 text-center mb-8 sm:mb-12">Why Choose TISCO Market?</h2>
          
          {/* Desktop Grid */}
          <div className="hidden md:grid grid-cols-1 md:grid-cols-2 gap-8">
            {[
              {
                icon: Clock,
                title: '24/7 Customer Support',
                description: 'Our dedicated support team is always ready to help, any time of day.'
              },
              {
                icon: CheckCircle,
                title: 'Safe, Secure Delivery',
                description: 'Items handled with care and sealed packaging.'
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
                    <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <IconComponent className="h-6 w-6 text-gray-700" />
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

          {/* Mobile Slider */}
          <div className="md:hidden">
            <MobileSlider itemsPerView={1} showDots={true} showArrows={true}>
              {[
                {
                  icon: Clock,
                  title: '24/7 Customer Support',
                  description: 'Our dedicated support team is always ready to help, any time of day.'
                },
                {
                  icon: CheckCircle,
                  title: 'Safe, Secure Delivery',
                  description: 'Items handled with care and sealed packaging.'
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
                      <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <IconComponent className="h-6 w-6 text-gray-700" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900 mb-2">{feature.title}</h3>
                        <p className="text-gray-600">{feature.description}</p>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </MobileSlider>
          </div>
        </section>

        {/* Team Section */}
        <section className="mb-12 sm:mb-16">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 text-center mb-8 sm:mb-12">Meet Our Team</h2>
          
          {/* Desktop Grid */}
          <div className="hidden sm:grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
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
                  <p className="text-gray-700 font-medium mb-3">{member.role}</p>
                  <p className="text-sm text-gray-600">{member.bio}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Mobile Slider */}
          <div className="sm:hidden">
            <MobileSlider itemsPerView={1} showDots={true} showArrows={true}>
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
                    <p className="text-gray-700 font-medium mb-3">{member.role}</p>
                    <p className="text-sm text-gray-600">{member.bio}</p>
                  </CardContent>
                </Card>
              ))}
            </MobileSlider>
          </div>
        </section>

        {/* CTA Section */}
        <section className="text-center">
          <Card className="bg-white border">
            <CardContent className="py-12">
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4">Ready to Start Shopping?</h2>
              <p className="text-gray-600 mb-8 max-w-2xl mx-auto">
                Shop confidently with TISCO Market — built for speed, value, and simplicity.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button asChild size="lg" variant="default">
                  <Link href="/products">Browse Products</Link>
                </Button>
                <Button asChild size="lg" variant="outline">
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
