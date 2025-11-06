import { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'

export const metadata: Metadata = {
  title: 'Tech Services | TISCO Market - PC Building & Setup Services Tanzania',
  description: 'Professional tech services in Tanzania: Custom PC building, ergonomic office setup, software installation, device repair, and game installation. Certified technicians provide 24-48 hour service with 1-year warranty on PC builds. Complete workspace solutions in Dar es Salaam.',
  keywords: [
    'PC building Tanzania', 'custom PC build Dar es Salaam', 'office setup Tanzania', 
    'computer repair Tanzania', 'software installation Tanzania', 'desktop setup services',
    'gaming PC build Tanzania', 'workstation setup', 'tech services Tanzania',
    'computer technician Tanzania', 'system optimization', 'hardware installation',
    'workspace setup Tanzania', 'ergonomic office design Dar es Salaam', 'multi-monitor setup Tanzania',
    'cable management services', 'lighting optimization Tanzania', 'network setup services',
    'BIOS setup Tanzania', 'OS installation Tanzania', 'driver updates Dar es Salaam',
    'security configuration Tanzania', 'data migration services', 'performance testing Tanzania',
    'device repair Tanzania', 'game installation Tanzania', 'certified technicians Dar es Salaam',
    'fast tech repair Tanzania', '24-48 hour service Tanzania', 'professional assembly Tanzania',
    'component consultation Tanzania', '1-year warranty PC builds', 'software licensing Tanzania',
    'system diagnostics Tanzania', 'PC optimization services', 'computer setup expert Tanzania'
  ],
  openGraph: {
    title: 'Professional Tech Services | TISCO Market Tanzania',
    description: 'Custom PC building, ergonomic office setup, software installation, device repair & game installation. Certified technicians, 24-48hr service, 1-year warranty.',
    url: 'https://tiscomarket.store/services',
    images: ['https://tiscomarket.store/services/pcbuild.jpeg'],
  },
  twitter: {
    title: 'Professional Tech Services | TISCO Market Tanzania',
    description: 'Custom PC building, ergonomic office setup, software installation, device repair & game installation. Certified technicians, 24-48hr service, 1-year warranty.',
    images: ['https://tiscomarket.store/services/pcbuild.jpeg'],
  },
}
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
// Removed unused form primitives now that form is a separate component
import { ServiceBookingForm } from '@/components/ServiceBookingForm'
import { 
  Monitor, 
  Cpu, 
  Settings,
  CheckCircle,
  ArrowRight,
  Users,
  Award,
  Zap
} from 'lucide-react'
import { PageLayout } from '@/components/shared'
import { ServicesHeroCarousel } from '@/components/ServicesHeroCarousel'

interface Service {
  id: string
  title: string
  description: string
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>
  features: string[]
  image: string
  gallery: string[]
}

const services: Service[] = [
  {
    id: 'pc-building',
    title: 'Custom PC Building',
    description: 'Custom PC builds tailored to your needs and budget.',
    icon: Cpu,
    features: [
      'Component consultation',
      'Professional assembly',
      'Cable management',
      'BIOS & OS setup',
      '1-year warranty',
      'Performance testing'
    ],
    image: '/services/pcbuild.jpeg',
    gallery: ['/services/pcbuild.jpeg', '/services/gaming-pc-build.jpeg']
  },
  {
    id: 'office-setup',
    title: 'Desktop/Office Space Setup',
    description: 'Complete workstation setup for optimal productivity.',
    icon: Monitor,
    features: [
      'Ergonomic design',
      'Multi-monitor setup',
      'Cable organization',
      'Lighting optimization',
      'Software installation',
      'Network setup'
    ],

    image: '/services/desksetup.jpeg',
    gallery: ['/services/desksetup.jpeg', '/services/desksetup2.jpeg', '/services/desksetup3.jpeg']
  },
  {
    id: 'software-installation',
    title: 'Computer/Software Installation',
    description: 'Expert OS, software, and hardware installation.',
    icon: Settings,
    features: [
      'OS installation/upgrade',
      'Software setup & licensing',
      'Driver updates',
      'Security configuration',
      'Data migration',
      'System optimization'
    ],

    image: '/services/software.jpeg',
    gallery: ['/services/software.jpeg']
  }
]

interface DbService {
  id: string
  title: string
  description?: string
  features?: string[]
  image?: string
  gallery?: string[]
}

async function getDbServices(): Promise<DbService[]> {
  try {
    // Use direct Supabase client for more reliable production access
    const { createClient } = await import('@supabase/supabase-js')
    
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE) {
      console.error('Missing Supabase environment variables for services')
      return []
    }
    
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE
    )
    
    const { data: services, error } = await supabase
      .from('services')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Services database error:', error)
      return []
    }

    console.log(`Successfully fetched ${services?.length || 0} services from database`)
    return (services || []) as DbService[]
  } catch (error) {
    console.error('Critical error fetching services:', error)
    return []
  }
}

export default async function ServicesPage({ searchParams }: { searchParams: Promise<{ service?: string }> }) {
  const resolvedSearchParams = await searchParams
  // Fetch real services from API (server role) to ensure we have valid UUID ids
  const dbServices = await getDbServices()
  const dbServiceIdByTitle = new Map<string, string>(
    (dbServices || []).map((s) => [s.title, s.id])
  )

  return (
    <PageLayout>
      {/* Hero Carousel */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 relative z-10">
        <ServicesHeroCarousel />
      </div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-8">

        {/* Header */}
        <div className="text-center mb-16 relative">
          <div className="inline-block mb-6">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-gray-900 tracking-tight">
              <span className="relative inline-block">
                <span className="relative">Top</span>
                <span className="absolute bottom-1 left-0 w-full h-4 bg-gradient-to-r from-purple-500 to-purple-600 transform -skew-y-1 opacity-30"></span>
              </span>
              {" "}Services
            </h1>
          </div>
          <p className="text-lg md:text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Whether it&apos;s <span className="font-semibold text-gray-800">one rig</span>, a <span className="font-semibold text-gray-800">home space</span>, or an <span className="font-semibold text-gray-800">entire office</span>
            <span className="block mt-2 text-purple-600 font-semibold">we&apos;ve got you covered.</span>
          </p>
        </div>

        {/* Services - Mobile Slider */}
        <div className="lg:hidden mb-16">
          <div className="-mx-4 px-4">
            <div className="flex overflow-x-auto snap-x snap-mandatory gap-6 horizontal-scroll scroll-container">
              {services.map((service) => {
                const IconComponent = service.icon
                const resolvedId = dbServiceIdByTitle.get(service.title) ?? service.id
                return (
                  <div key={service.id} className="snap-center shrink-0 w-[85%] sm:w-[70%]">
                    <Card className="relative hover:shadow-xl transition-all duration-300 overflow-hidden h-full flex flex-col">
                      <CardContent className="p-3 pb-0">
                        {/* Service Image */}
                        <div className="relative h-32 sm:h-40 lg:h-48 overflow-hidden rounded-md bg-gray-100 mb-3">
                          <Image
                            src={service.image}
                            alt={service.title}
                            fill
                            sizes="(max-width: 640px) 85vw, (max-width: 1024px) 70vw, 50vw"
                            className="object-cover transition-transform duration-300 hover:scale-110"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                          
                          {/* Icon Overlay */}
                          <div className="absolute top-4 right-4">
                            <div className="w-12 h-12 rounded-full flex items-center justify-center bg-white/90">
                              <IconComponent className="h-6 w-6 text-gray-600" />
                            </div>
                          </div>
                        </div>
                      </CardContent>
                      
                      <CardHeader className="text-center">
                        <CardTitle className="text-xl mb-2">{service.title}</CardTitle>
                        <p className="text-gray-600 text-sm">{service.description}</p>
                      </CardHeader>

                      <CardContent className="flex-1 flex flex-col">
                        <div className="space-y-3 mb-6 flex-1">
                          {service.features.map((feature, index) => (
                            <div key={index} className="flex items-start gap-3">
                              <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                              <span className="text-sm text-gray-700">{feature}</span>
                            </div>
                          ))}
                        </div>

                        <div className="border-t pt-4 mt-auto">
                          <Button asChild className="w-full bg-gray-900 hover:bg-gray-800">
                            <Link href={`/services?service=${resolvedId}#booking-form`}>
                              Select Service
                              <ArrowRight className="h-4 w-4 ml-2" />
                            </Link>
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Services - Desktop Grid */}
        <div className="hidden lg:grid grid-cols-3 gap-8 mb-16 auto-rows-fr">
          {services.map((service) => {
            const IconComponent = service.icon
            const resolvedId = dbServiceIdByTitle.get(service.title) ?? service.id
            return (
              <Card key={service.id} className="relative hover:shadow-xl transition-all duration-300 overflow-hidden h-full flex flex-col">
                <CardContent className="p-3 pb-0">
                  {/* Service Image */}
                  <div className="relative h-48 overflow-hidden rounded-md bg-gray-100 mb-3">
                    <Image
                      src={service.image}
                      alt={service.title}
                      fill
                      sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      className="object-cover transition-transform duration-300 hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                    
                    {/* Icon Overlay */}
                    <div className="absolute top-4 right-4">
                      <div className="w-12 h-12 rounded-full flex items-center justify-center bg-white/90">
                        <IconComponent className="h-6 w-6 text-gray-600" />
                      </div>
                    </div>
                  </div>
                </CardContent>
                
                <CardHeader className="text-center">
                  <CardTitle className="text-xl mb-2">{service.title}</CardTitle>
                  <p className="text-gray-600 text-sm">{service.description}</p>
                </CardHeader>

                <CardContent className="flex-1 flex flex-col">
                  <div className="space-y-3 mb-6 flex-1">
                    {service.features.map((feature, index) => (
                      <div key={index} className="flex items-start gap-3">
                        <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                        <span className="text-sm text-gray-700">{feature}</span>
                      </div>
                    ))}
                  </div>

                  <div className="border-t pt-4 mt-auto">
                    <Button asChild className="w-full bg-gray-900 hover:bg-gray-800">
                      <Link href={`/services?service=${resolvedId}#booking-form`}>
                        Select Service
                        <ArrowRight className="h-4 w-4 ml-2" />
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Custom Service Promo */}
        <div className="mb-16">
          <Card className="overflow-hidden">
            <div className="relative w-full h-56 sm:h-72 lg:h-80 bg-gray-900">
              <Image
                src="/services/customservice.webp"
                alt="Describe your issue - custom service"
                fill
                sizes="100vw"
                className="object-contain object-center"
                priority
              />
              <div className="absolute inset-0 bg-black/20" />
              <div className="absolute inset-0 flex flex-col md:flex-row items-center md:items-center justify-between gap-3 md:gap-4 px-4 py-4 sm:px-6 md:px-10">
                <div className="text-white max-w-2xl text-center md:text-left">
                  <h3 className="text-xl sm:text-2xl md:text-3xl font-bold mb-1 md:mb-2">Have a unique issue?</h3>
                  <p className="text-white/90 text-sm sm:text-base">Tell us your problem and we&apos;ll craft the final piece of the solution.</p>
                </div>
                <Button asChild size="sm" className="bg-white text-gray-900 hover:bg-gray-100 rounded-full mt-2 md:mt-0 md:size-lg px-4 py-2 md:px-6 md:py-3 text-sm md:text-base">
                  <Link href="/services?service=other#booking-form">We are all Ears!!</Link>
                </Button>
              </div>
            </div>
          </Card>
        </div>

        {/* Service Booking Form */}
        <section className="mb-16" id="booking-form" data-section="booking">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <div className="inline-block mb-6">
                <h2 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-gray-900 tracking-tight">
                  <span className="relative inline-block">
                    <span className="relative z-10">Book Your</span>
                    <span className="absolute bottom-1 left-0 w-full h-3 bg-gradient-to-r from-blue-500 to-blue-600 transform -skew-y-1 opacity-30"></span>
                  </span>
                  {" "}Service
                </h2>
              </div>
              <p className="text-base md:text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">
                Ready to get started?
                <span className="block mt-2 font-medium text-gray-700">Fill out the form below and we&apos;ll get back to you within <span className="font-bold text-blue-600">24 hours</span>.</span>
              </p>
            </div>

            <ServiceBookingForm 
              defaultServiceId={resolvedSearchParams?.service}
              services={(dbServices || []).map((s) => ({ id: s.id, title: s.title }))}
            />
          </div>
        </section>

        {/* Why Choose Our Services */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">
            Why Choose Us?
          </h2>
          
          {/* Mobile Slider */}
          <div className="md:hidden mb-8">
            <div className="-mx-4 px-4">
              <div className="flex overflow-x-auto snap-x snap-mandatory gap-4 horizontal-scroll scroll-container">
                {[
                  {
                    icon: Award,
                    title: 'Certified Technicians and Designers',
                    description: 'Professionals with extensive hardware, software and design experience.'
                  },
                  {
                    icon: Zap,
                    title: 'Fast & Reliable',
                    description: 'Fast service without compromising quality. Most jobs done in 24-48 hours.'
                  },
                  {
                    icon: Users,
                    title: 'Customer Focused',
                    description: 'Personalized service for your needs and budget. 100% satisfaction guaranteed.'
                  }
                ].map((benefit, index) => {
                  const IconComponent = benefit.icon
                  return (
                    <div key={index} className="snap-center shrink-0 w-[85%] sm:w-[70%]">
                      <Card className="text-center hover:shadow-lg transition-shadow h-full">
                        <CardContent className="p-6 sm:p-8">
                          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                            <IconComponent className="h-8 w-8 text-blue-600" />
                          </div>
                          <h3 className="font-semibold text-xl text-gray-900 mb-3">{benefit.title}</h3>
                          <p className="text-gray-600">{benefit.description}</p>
                        </CardContent>
                      </Card>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Desktop Grid */}
          <div className="hidden md:grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: Award,
                title: 'Certified Technicians and Designers',
                description: 'Professionals with extensive hardware, software and design experience.'
              },
              {
                icon: Zap,
                title: 'Fast & Reliable',
                description: 'Fast service without compromising quality. Most jobs done in 24-48 hours.'
              },
              {
                icon: Users,
                title: 'Customer Focused',
                description: 'Personalized service for your needs and budget. 100% satisfaction guaranteed.'
              }
            ].map((benefit, index) => {
              const IconComponent = benefit.icon
              return (
                <Card key={index} className="text-center hover:shadow-lg transition-shadow">
                  <CardContent className="p-8">
                    <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                      <IconComponent className="h-8 w-8 text-blue-600" />
                    </div>
                    <h3 className="font-semibold text-xl text-gray-900 mb-3">{benefit.title}</h3>
                    <p className="text-gray-600">{benefit.description}</p>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </section>

        {/* Removed: Customer Reviews */}

        {/* Removed: Gradient CTA */}
      </div>
    </PageLayout>
  )
}
