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
import { getServices } from '@/lib/database'
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
    description: 'Professional custom PC assembly and configuration tailored to your specific needs and budget.',
    icon: Cpu,
    features: [
      'Component selection consultation',
      'Professional assembly and testing',
      'Cable management and optimization',
      'BIOS configuration and OS installation',
      '1-year build warranty',
      'Performance benchmarking'
    ],
    image: '/services/pcbuild.jpeg',
    gallery: ['/services/pcbuild.jpeg', '/services/gaming-pc-build.jpeg']
  },
  {
    id: 'office-setup',
    title: 'Desktop/Office Space Setup',
    description: 'Complete workstation and office space configuration for optimal productivity and ergonomics.',
    icon: Monitor,
    features: [
      'Ergonomic workstation design',
      'Multi-monitor setup and calibration',
      'Cable management and organization',
      'Lighting and acoustics optimization',
      'Productivity software installation',
      'Network and connectivity setup'
    ],

    image: '/services/desksetup.jpeg',
    gallery: ['/services/desksetup.jpeg', '/services/desksetup2.jpeg', '/services/desksetup3.jpeg']
  },
  {
    id: 'software-installation',
    title: 'Computer/Software Installation',
    description: 'Expert installation and configuration of operating systems, software, and hardware components.',
    icon: Settings,
    features: [
      'Operating system installation/upgrade',
      'Software suite setup and licensing',
      'Driver installation and updates',
      'Security software configuration',
      'Data migration and backup setup',
      'System optimization and tuning'
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

export default async function ServicesPage({ searchParams }: { searchParams: { service?: string } }) {
  // Fetch real services from DB to ensure we have valid UUID ids
  const dbServices = (await getServices()) as DbService[]
  const dbServiceIdByTitle = new Map<string, string>(
    (dbServices || []).map((s) => [s.title, s.id])
  )

  return (
    <PageLayout>
      {/* Hero Carousel */}
      <ServicesHeroCarousel />
      
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
            Professional Tech Services
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Expert computer services from custom PC building to complete office setups. 
            Professional installation, configuration, and optimization for all your tech needs.
          </p>
        </div>

        {/* Services Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-16 auto-rows-fr">
          {services.map((service) => {
            const IconComponent = service.icon
            const resolvedId = dbServiceIdByTitle.get(service.title) ?? service.id
            return (
              <Card key={service.id} className="relative hover:shadow-xl transition-all duration-300 overflow-hidden h-full flex flex-col">
                {/* Service Image */}
                <div className="relative h-48 overflow-hidden">
                  <Image
                    src={service.image}
                    alt={service.title}
                    fill
                    className="object-cover transition-transform duration-300 hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                  {/* Removed deprecated popularity badge */}
                  
                  {/* Icon Overlay */}
                  <div className="absolute top-4 right-4">
                    <div className="w-12 h-12 rounded-full flex items-center justify-center bg-white/90">
                      <IconComponent className="h-6 w-6 text-gray-600" />
                    </div>
                  </div>
                </div>
                
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
                className="object-contain object-center"
                priority
              />
              <div className="absolute inset-0 bg-black/20" />
              <div className="absolute inset-0 flex flex-col md:flex-row items-center md:items-center justify-between gap-4 px-6 sm:px-10">
                <div className="text-white max-w-2xl text-center md:text-left">
                  <h3 className="text-2xl sm:text-3xl font-bold mb-2">Have a unique issue?</h3>
                  <p className="text-white/90">Tell us your problem and we’ll craft the final piece of the solution.</p>
                </div>
                <Button asChild size="lg" className="bg-white text-gray-900 hover:bg-gray-100">
                  <Link href="/services?service=other#booking-form">Describe Your Issue</Link>
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
                Book Your Service
              </h2>
              <p className="text-lg text-gray-600">
                Ready to get started? Fill out the form below and we&apos;ll get back to you within 24 hours.
              </p>
            </div>

            <ServiceBookingForm 
              defaultServiceId={searchParams?.service}
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
              <div className="flex overflow-x-auto snap-x snap-mandatory gap-4 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
                {[
                  {
                    icon: Award,
                    title: 'Certified Technicians',
                    description: 'Our team consists of certified professionals with years of experience in computer hardware and software.'
                  },
                  {
                    icon: Zap,
                    title: 'Fast & Reliable',
                    description: 'Quick turnaround times without compromising on quality. Most services completed within 24-48 hours.'
                  },
                  {
                    icon: Users,
                    title: 'Customer Focused',
                    description: 'Personalized service tailored to your specific needs and budget. 100% satisfaction guaranteed.'
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
                description: 'Our team consists of certified professionals with years of experience in computer hardware and software.'
              },
              {
                icon: Zap,
                title: 'Fast & Reliable',
                description: 'Quick turnaround times without compromising on quality. Most services completed within 24-48 hours.'
              },
              {
                icon: Users,
                title: 'Customer Focused',
                description: 'Personalized service tailored to your specific needs and budget. 100% satisfaction guaranteed.'
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
