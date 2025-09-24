import Link from 'next/link'
import Image from 'next/image'
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
import { PageLayout, Breadcrumb } from '@/components/shared'
import { ServicesHeroCarousel } from '@/components/ServicesHeroCarousel'
import { ServicesPromoGrid } from '@/components/ServicesPromoGrid'

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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
        <ServicesHeroCarousel />
      </div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb */}
        <Breadcrumb 
          items={[
            { label: 'Home', href: '/' },
            { label: 'Services' }
          ]} 
          className="mb-8" 
        />

        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            Top Services
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
          Whether it’s one rig, home space or an entire office, we’ve got you covered.
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

        {/* Services Promotional Grid */}
        <ServicesPromoGrid />

        {/* Custom Service Promo */}
        <div className="mb-16">
          <Card className="overflow-hidden">
            <div className="relative w-full h-56 sm:h-72 lg:h-80 bg-gray-900">
              <Image
                src="/services/customservice.webp"
                alt="Describe your issue - custom service"
                fill
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
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Book Your Service Appointment.
              </h2>
              <p className="text-lg text-gray-600">
                Ready to get started? Fill out the form below and we&apos;ll get back to you within 24 hours.
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
            Why Choose Our Tech Services?
          </h2>
          
          {/* Mobile Slider */}
          <div className="md:hidden mb-8">
            <div className="-mx-4 px-4">
              <div className="flex overflow-x-auto snap-x snap-mandatory gap-4 horizontal-scroll scroll-container">
                {[
                  {
                    icon: Award,
                    title: 'Certified Technicians',
                    description: 'Certified professionals with extensive hardware and software experience.'
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
                title: 'Certified Technicians',
                description: 'Certified professionals with extensive hardware and software experience.'
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
