import Link from 'next/link'
import Image from 'next/image'
import React from 'react'

interface AuthPageShellProps {
  title: string
  subtitle?: string
  children: React.ReactNode
  showHeader?: boolean
  showTopBar?: boolean
  centerContent?: boolean
}

export const AuthPageShell = ({ title, subtitle, children, showHeader = true, showTopBar = true, centerContent = false }: AuthPageShellProps) => {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top brand bar */}
      {showTopBar && (
        <div className="border-b border-gray-200 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-3">
              <Image src="/circular.svg" alt="TISCO Market Logo" width={36} height={36} className="w-9 h-9" />
              <span className="text-lg sm:text-xl font-bold text-gray-900 font-chango">TISCOマーケット</span>
            </Link>
            <div className="text-sm text-gray-500 hidden sm:block">Secure authentication</div>
          </div>
        </div>
      )}

      {centerContent ? (
        <div className="px-4 sm:px-6 lg:px-8 py-12 min-h-[calc(100vh-0px)] flex items-center justify-center">
          <div className="w-full max-w-md">
            {showHeader && (
              <div className="mb-6 text-center">
                <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
                {subtitle && <p className="text-gray-600 mt-1">{subtitle}</p>}
              </div>
            )}
            {children}
          </div>
        </div>
      ) : (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 lg:py-16">
          {showHeader && (
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
              {subtitle && <p className="text-gray-600 mt-1">{subtitle}</p>}
            </div>
          )}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-start">
            {/* Auth Content */}
            <div className="lg:col-span-5 xl:col-span-4 self-start">
              <div className="max-w-md">
                {children}
              </div>
            </div>

            {/* Visual panel */}
            <div className="hidden lg:block lg:col-span-7 xl:col-span-8 self-start">
              <div className="relative overflow-hidden rounded-2xl border border-gray-200 shadow-sm">
                <Image
                  src="/homehero2.jpg"
                  alt="Shop with confidence at TISCO Market"
                  width={1200}
                  height={900}
                  className="h-[520px] xl:h-[560px] w-full object-cover"
                  priority
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-black/10 to-transparent" />
                <div className="absolute bottom-4 left-4 right-4 text-white">
                  <h3 className="text-xl font-semibold">TISCOマーケット</h3>
                  <p className="text-sm text-white/80 mt-1">Fast checkout, secure payments, and curated deals daily.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AuthPageShell
