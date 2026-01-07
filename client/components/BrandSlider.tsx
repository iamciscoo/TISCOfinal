import Image from 'next/image'

const brandLogos: { src: string; alt: string }[] = [
  { src: '/brands/AMD.png', alt: 'AMD' },
  { src: '/brands/Apple.png', alt: 'Apple' },
  { src: '/brands/Microsoft.png', alt: 'Microsoft' },
  { src: '/brands/Nvidia.png', alt: 'NVIDIA' },
  { src: '/brands/PlayStation.png', alt: 'PlayStation' },
  { src: '/brands/google.png', alt: 'Google' },
  { src: '/brands/hp.png', alt: 'HP' },
]

export const BrandSlider = () => {
  const logos = [...brandLogos, ...brandLogos]

  return (
    <section className="bg-gradient-to-b from-white via-gray-50 to-white py-4 sm:py-6 mt-2 mb-4">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Title */}
        <div className="text-center mb-8 sm:mb-10">
          <div className="inline-block">
            <h3 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-gray-900 tracking-tight">
              Access Products from
              <span className="relative inline-block ml-2">
                <span className="relative z-10">Industry Leaders</span>
                <span className="absolute bottom-1 left-0 w-full h-2.5 bg-gradient-to-r from-green-500 to-emerald-600 transform -skew-y-1 opacity-30"></span>
              </span>
            </h3>
          </div>
          <p className="mt-4 text-gray-600 max-w-2xl mx-auto">
            We partner with the world&apos;s leading technology brands to bring you authentic, quality products
          </p>
        </div>

        <div className="brand-slider relative overflow-hidden">
          <div className="h-[60px]">
            <div className="track flex items-center gap-8 md:gap-12 h-full will-change-transform">
              {logos.map((logo, idx) => {
                const isMicrosoftOrAMD = logo.alt === 'Microsoft' || logo.alt === 'AMD'
                const logoWidth = isMicrosoftOrAMD
                  ? 'w-[210px] sm:w-[220px]'
                  : 'w-[160px] sm:w-[180px]'
                const logoHeight = isMicrosoftOrAMD ? 'h-[135px]' : 'h-full'

                return (
                  <div
                    key={`${logo.alt}-${idx}`}
                    className={`relative ${logoHeight} ${logoWidth} flex items-center justify-center`}
                  >
                    <Image
                      src={logo.src}
                      alt={`${logo.alt} logo`}
                      fill
                      sizes="(max-width: 640px) 180px, 200px"
                      className="object-contain opacity-80 grayscale-[30%] hover:opacity-100 hover:grayscale-0 transition-all duration-300"
                      priority={false}
                    />
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
