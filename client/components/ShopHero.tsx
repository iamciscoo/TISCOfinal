"use client"

import React, { useEffect, useRef } from "react"
import Image from "next/image"
import Link from "next/link"

/**
 * ShopHero
 * - Full viewport hero (minus navbar height) with parallax + clip effect on scroll
 * - Large, bold white word overlay spanning width: "Shop"
 * - Rounded corners, responsive, minimal JS with CSS vars
 * - Background image: /officespace.jpeg (served from client/public)
 */
export default function ShopHero({
  imageSrc = "/officespace.png",
  title = "Shop",
  ctaHref = "/deals",
  ctaLabel = "View Deals & Offers →",
}: {
  imageSrc?: string
  title?: string
  ctaHref?: string
  ctaLabel?: string
}) {
  const heroRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const el = heroRef.current
    if (!el) return

    let raf = 0
    const prefersReduced =
      typeof window !== "undefined" &&
      window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches

    const update = () => {
      // Reach full compression after ~50% viewport scroll for snappier transition
      const max = Math.max(1, window.innerHeight * 0.5)
      const y = window.scrollY
      const p = Math.min(1, Math.max(0, y / max))
      el.style.setProperty("--p", String(prefersReduced ? 0 : p))
    }

    const onScroll = () => {
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(update)
    }

    const onResize = () => update()

    update()
    window.addEventListener("scroll", onScroll, { passive: true })
    window.addEventListener("resize", onResize)

    return () => {
      window.removeEventListener("scroll", onScroll)
      window.removeEventListener("resize", onResize)
      cancelAnimationFrame(raf)
    }
  }, [])

  return (
    <section aria-label={`${title} hero`} className="relative">
      <div
        ref={heroRef}
        className="relative w-full overflow-hidden rounded-3xl shadow-md"
        style={{
          containerType: "inline-size",
          // Reduced mobile height, better desktop height
          height: "clamp(25vh, 15vw + 20vh, 60vh)",
          // Enhanced clip effect that cuts more dramatically on scroll
          clipPath: "inset(0 0 calc(var(--p,0) * 30vh) 0 round 1.5rem)",
          // Pull the next section upward by the same amount we clip, removing the perceived gap
          marginBottom: "calc(var(--p,0) * -30vh)",
          transition: "clip-path 150ms ease-out, margin-bottom 150ms ease-out",
        } as React.CSSProperties}
      >
        {/* Background image with subtle parallax */}
        <Image
          src={imageSrc}
          alt="Officespace background"
          fill
          priority
          className="object-cover object-center pointer-events-none select-none parallax-element"
          style={{
            transform:
              "translateY(calc(var(--p,0) * 8vh)) scale(calc(1 + var(--p,0) * 0.04))",
            filter: "saturate(1.1) brightness(0.85) contrast(1.1)",
            objectPosition: "center 40%",
          }}
        />

        {/* Soft overlay for contrast - lighter on desktop for better image visibility */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/25 to-black/40 sm:bg-black/25" aria-hidden="true" />


        {/* Giant word overlay with promotion text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <h1
            className="select-none pointer-events-none text-white font-chango font-normal leading-[0.7] tracking-[0.15em] whitespace-nowrap px-2 sm:px-4"
            style={{
              // Better responsive sizing for desktop visibility
              fontSize: "min(75cqw, 18vw, 12rem)",
              opacity: "calc(1 - var(--p,0) * 0.3)",
              transform:
                "translateY(calc(var(--p,0) * -3vh)) scale(calc(1 - var(--p,0) * 0.1))",
              textShadow: "0 8px 32px rgba(0,0,0,0.7), 0 4px 16px rgba(0,0,0,0.5)",
              willChange: "transform, opacity",
              letterSpacing: "0.25em",
              WebkitTextStroke: "1px rgba(255,255,255,0.1)",
            }}
          >
            {title}
          </h1>
          
          {/* Promotion text that disappears on scroll */}
          <div
            className="mt-4 sm:mt-6 text-center px-4"
            style={{
              opacity: "calc(1 - var(--p,0) * 1.5)",
              transform: "translateY(calc(var(--p,0) * 2vh))",
              willChange: "transform, opacity",
            }}
          >
            <p className="text-white/90 text-sm sm:text-base font-medium tracking-wide">
              ✨ Discover Amazing Products & Great Deals
            </p>
            
            {/* CTA Button */}
            <Link
              href={ctaHref}
              className="inline-block mt-4 sm:mt-6 px-6 py-3 bg-white/10 backdrop-blur-sm border border-white/20 text-white font-medium rounded-full hover:bg-white/20 transition-all duration-300 text-sm sm:text-base"
              style={{
                opacity: "calc(1 - var(--p,0) * 1.2)",
                transform: "translateY(calc(var(--p,0) * 3vh))",
                willChange: "transform, opacity",
              }}
            >
              {ctaLabel}
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
