import { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'About Us | TISCO Market - No BS Tech Solutions & Rare Finds',
  description: 'Learn about TISCO Market: the no-nonsense destination for rare tech products and professional services. Founded August 2025, launching November 2025. No bullshit, just what you need.',
  keywords: [
    'about TISCO market', 'tech marketplace', 'rare tech products', 'professional tech services',
    'no bullshit tech store', 'TISCO company info', 'tech solutions platform',
    'reliable tech marketplace', 'transparent pricing tech store'
  ],
  openGraph: {
    title: 'About TISCO Market - No BS Tech Solutions & Rare Finds',
    description: 'The no-nonsense destination for rare tech products and professional services. No bullshit, just what you need.',
    url: 'https://tiscomarket.store/about',
    images: ['/logo-email.png'],
  },
  twitter: {
    title: 'About TISCO Market - No BS Tech Solutions & Rare Finds',
    description: 'The no-nonsense destination for rare tech products and professional services. No bullshit, just what you need.',
    images: ['/logo-email.png'],
  },
}

import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { MobileSlider } from '@/components/ui/mobile-slider'
import { 
  Users, 
  Award, 
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
             TISCO マーケット (māketto)
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
                  <strong>Founded in August 2025</strong>, TISCO Market emerged from a simple frustration: 
                  the tech industry had become bloated with corporate nonsense, inflated pricing, 
                  and unnecessary complexity. We cut through the BS to create something different.
                </p>
                <p>
                  We specialize in <strong>rare tech products</strong> and <strong>professional services</strong> 
                  that others won&apos;t touch — the hard-to-find components, the niche solutions, 
                  and the expert installations that make or break your projects.
                </p>
                <p>
                  <strong>Launching November 2025</strong>, we&apos;re building more than a marketplace. 
                  We&apos;re creating a platform where efficiency, honesty, and expertise come first — 
                  no fluff, no excuses, no corporate runaround.
                </p>
                <p>
                  From sourcing impossible-to-find parts to complete tech transformations, 
                  we handle both the hunting and the building.
                </p>
              </div>
            </div>
            <div className="relative">
              <Card className="bg-white border">
                <CardContent className="p-8">
                  <div className="space-y-5">
                    <div className="flex items-start gap-3">
                      <CheckCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                      <div>
                        <h3 className="font-semibold text-gray-900">Radical Efficiency</h3>
                        <p className="text-sm text-gray-600">Fast delivery, quick setup, rapid response — no bureaucratic waste.</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Shield className="h-5 w-5 text-blue-600 mt-0.5" />
                      <div>
                        <h3 className="font-semibold text-gray-900">Brutal Honesty</h3>
                        <p className="text-sm text-gray-600">Transparent pricing, genuine deals, authentic reviews — no corporate BS.</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Award className="h-5 w-5 text-blue-600 mt-0.5" />
                      <div>
                        <h3 className="font-semibold text-gray-900">Expert Accessibility</h3>
                        <p className="text-sm text-gray-600">Professional services without professional headaches or markup games.</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Development Timeline */}
        <section className="mb-12 sm:mb-16">
          <div className="text-center mb-8 sm:mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4">Our Development Journey</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              From concept to launch, building a platform that actually works for tech professionals.
            </p>
          </div>
          
          <div className="max-w-4xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <Card className="text-center hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Clock className="h-8 w-8 text-blue-600" />
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">August 2025</h3>
                  <p className="text-sm text-gray-600 mb-2">Platform Founded</p>
                  <p className="text-xs text-gray-500">Concept development and initial planning phase</p>
                </CardContent>
              </Card>
              
              <Card className="text-center hover:shadow-lg transition-shadow border-blue-200">
                <CardContent className="p-6">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Users className="h-8 w-8 text-blue-600" />
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">September - October 2025</h3>
                  <p className="text-sm text-gray-600 mb-2">Building & Testing</p>
                  <div className="text-xs text-gray-500 space-y-1">
                    <p>• Securing partnerships with rare tech suppliers</p>
                    <p>• Building curated inventory of hard-to-find components</p>
                    <p>• Establishing verified service provider network</p>
                    <p>• Platform testing & beta with tech professionals</p>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="text-center hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle className="h-8 w-8 text-green-600" />
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">November 2025</h3>
                  <p className="text-sm text-gray-600 mb-2">Public Launch</p>
                  <p className="text-xs text-gray-500">Full platform launch with curated products and services</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Our Mission & Vision */}
        <section className="mb-12 sm:mb-16">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 text-center mb-8 sm:mb-12">What Drives Us</h2>
          
          {/* Desktop Grid */}
          <div className="hidden md:grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                icon: Award,
                title: 'Your Tech Partner',
                description: 'We want to be the first place you think of when you need tech gear or professional setup services. No hunting around — just one reliable source.'
              },
              {
                icon: Clock,
                title: 'Speed That Matters',
                description: 'Your time is valuable. Fast delivery, quick installations, rapid support responses — because waiting around is frustrating.'
              },
              {
                icon: Shield,
                title: 'Honest Dealings',
                description: 'Fair prices, genuine reviews, authentic products. We believe trust is built through transparency, not marketing fluff.'
              },
              {
                icon: Heart,
                title: 'Finding the Unfindable',
                description: 'Those rare components and niche gadgets others don\'t carry? We specialize in tracking down exactly what you need.'
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
                  icon: Award,
                  title: 'Your Tech Partner',
                  description: 'We want to be the first place you think of when you need tech gear or professional setup services. No hunting around — just one reliable source.'
                },
                {
                  icon: Clock,
                  title: 'Speed That Matters',
                  description: 'Your time is valuable. Fast delivery, quick installations, rapid support responses — because waiting around is frustrating.'
                },
                {
                  icon: Shield,
                  title: 'Honest Dealings',
                  description: 'Fair prices, genuine reviews, authentic products. We believe trust is built through transparency, not marketing fluff.'
                },
                {
                  icon: Heart,
                  title: 'Finding the Unfindable',
                  description: 'Those rare components and niche gadgets others don\'t carry? We specialize in tracking down exactly what you need.'
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
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 text-center mb-8 sm:mb-12">Why We&apos;re Different</h2>
          
          {/* Desktop Grid */}
          <div className="hidden md:grid grid-cols-1 md:grid-cols-2 gap-8">
            {[
              {
                icon: CheckCircle,
                title: 'Complete Solutions',
                description: 'Why juggle multiple vendors? We handle both the products you need and the professional services to set them up — all in one place.'
              },
              {
                icon: Clock,
                title: 'No Bureaucratic Nonsense',
                description: 'Skip the complicated processes and endless phone trees. We cut through industry complexity to get things done quickly.'
              },
              {
                icon: Users,
                title: 'Built for Community',
                description: 'We work with businesses and customers who share our values: efficiency, authenticity, and getting things done right the first time.'
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
                  icon: CheckCircle,
                  title: 'Complete Solutions',
                  description: 'Why juggle multiple vendors? We handle both the products you need and the professional services to set them up — all in one place.'
                },
                {
                  icon: Clock,
                  title: 'No Bureaucratic Nonsense',
                  description: 'Skip the complicated processes and endless phone trees. We cut through industry complexity to get things done quickly.'
                },
                {
                  icon: Users,
                  title: 'Built for Community',
                  description: 'We work with businesses and customers who share our values: efficiency, authenticity, and getting things done right the first time.'
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
                name: 'Francis Jacob',
                role: 'CEO & Founder',
                bio: 'Passionate about cutting through industry BS and creating exceptional customer experiences. Building TISCO to be the reliable tech partner we always wished existed.',
                image: '/team/francis.jpg'
              },
              {
                name: 'Michael Chen',
                role: 'CTO',
                bio: 'Leading our technology vision to create the most efficient, user-friendly platform. Obsessed with performance, reliability, and getting things done right.',
                image: '/team/michael.jpg'
              },
              {
                name: 'Emily Rodriguez',
                role: 'Head of Customer Relations',
                bio: 'Ensuring every customer interaction exceeds expectations. Building trust through transparency, speed, and authentic service that actually solves problems.',
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
                  name: 'Francis Jacob',
                  role: 'CEO & Founder',
                  bio: 'Passionate about cutting through industry BS and creating exceptional customer experiences. Building TISCO to be the reliable tech partner we always wished existed.',
                  image: '/team/francis.jpg'
                },
                {
                  name: 'Michael Chen',
                  role: 'CTO',
                  bio: 'Leading our technology vision to create the most efficient, user-friendly platform. Obsessed with performance, reliability, and getting things done right.',
                  image: '/team/michael.jpg'
                },
                {
                  name: 'Emily Rodriguez',
                  role: 'Head of Customer Relations',
                  bio: 'Ensuring every customer interaction exceeds expectations. Building trust through transparency, speed, and authentic service that actually solves problems.',
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
                Shop confidently with TISCO マーケット — built for speed, value, and simplicity.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button asChild size="lg" variant="default" className="rounded-full">
                  <Link href="/products">Browse Products</Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="rounded-full">
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
