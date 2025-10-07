import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle, Cpu, Monitor, Settings } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

const services = [
  {
    icon: Cpu,
    title: "Custom PC Building",
    description:
      "Professional custom PC assembly and configuration tailored to your needs",
    features: [
      "Component consultation",
      "Professional assembly",
      "1-year warranty",
    ],
    image: "/services/pcbuild.jpeg",
  },
  {
    icon: Monitor,
    title: "Office Space Setup",
    description:
      "Complete workstation and office space configuration for productivity",
    features: ["Ergonomic design", "Multi-monitor setup", "Cable management"],
    image: "/services/desksetup.jpeg",
  },
  {
    icon: Settings,
    title: "Software Installation",
    description:
      "Expert installation and configuration of operating systems and software",
    features: ["OS installation", "Software licensing", "System optimization"],
    image: "/services/software.jpeg",
  },
];

// Reusable service card to avoid duplication across mobile slider and desktop grid
const ServiceCard = ({ service }: { service: (typeof services)[number] }) => {
  const IconComponent = service.icon;
  return (
    <Card className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1 overflow-hidden">
      <CardContent className="p-3 pb-0">
        {/* Service Image */}
        <div className="relative h-40 overflow-hidden rounded-md bg-gray-100 mb-3">
          <Image
            src={service.image}
            alt={service.title}
            fill
            sizes="(min-width: 1024px) 33vw, 100vw"
            className="object-cover transition-transform duration-300 group-hover:scale-110"
            priority={service.image === "/services/pcbuild.jpeg"}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />

          {/* Icon Overlay */}
          <div className="absolute top-3 right-3">
            <div className="w-10 h-10 bg-white/90 rounded-full flex items-center justify-center group-hover:bg-blue-600 transition-colors">
              <IconComponent className="h-5 w-5 text-gray-600 group-hover:text-white transition-colors" />
            </div>
          </div>
        </div>
      </CardContent>

      <CardContent className="p-6 text-center">
        <h3 className="font-semibold text-lg text-gray-900 mb-3">
          {service.title}
        </h3>

        <p className="text-gray-600 mb-4 text-sm">{service.description}</p>

        <div className="space-y-2 mb-4">
          {service.features.map((feature, featureIndex) => (
            <div
              key={featureIndex}
              className="flex items-center justify-center gap-2 text-xs text-gray-500"
            >
              <CheckCircle className="h-3 w-3 text-green-600" />
              <span>{feature}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export const ServicesPreview = () => {
  return (
    <section className="py-1 bg-white w-full overflow-hidden">
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Top Services
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            We handle the builds, the installs, and the headaches.
          </p>
        </div>

        {/* Mobile Slider */}
        <div className="md:hidden mb-12">
          <div className="-mx-4 px-4">
            <div className="flex overflow-x-auto snap-x snap-mandatory gap-4 horizontal-scroll scroll-container">
              {services.map((service, index) => (
                <Link
                  key={index}
                  href="/services#booking-form"
                  aria-label={`${service.title} service details`}
                  className="snap-center shrink-0 w-[85%] sm:w-[70%]"
                >
                  <ServiceCard service={service} />
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Services Grid (md and up) */}
        <div className="hidden md:grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
          {services.map((service, index) => (
            <Link
              key={index}
              href="/services#booking-form"
              aria-label={`${service.title} service details`}
              className="block"
            >
              <ServiceCard service={service} />
            </Link>
          ))}
        </div>

      </div>
    </section>
  );
};
