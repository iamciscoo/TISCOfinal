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
    <section className="bg-white py-[28px]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
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
                      className="object-contain"
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
