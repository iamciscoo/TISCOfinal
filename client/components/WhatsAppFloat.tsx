'use client'

import { useState } from 'react'
import Link from 'next/link'
import { LayoutDashboard } from 'lucide-react'

export const WhatsAppFloat: React.FC = () => {
  const [showWhatsAppTooltip, setShowWhatsAppTooltip] = useState(false)
  const [showSpaceTooltip, setShowSpaceTooltip] = useState(false)

  return (
    <>
      {/* My Space Button - Left on Mobile, Right (Stacked) on Desktop */}
      <div className="fixed z-50 transition-all duration-300 bottom-6 left-6 md:bottom-[88px] md:left-auto md:right-6 flex flex-col items-center">
        <div className="relative group/space">
          {/* Pulse effect */}
          <div className="absolute inset-0 rounded-full bg-[#4070E0] animate-ping opacity-20 group-hover/space:opacity-40 transition-opacity" />
          <div className="absolute inset-0 rounded-full bg-[#4070E0] animate-pulse opacity-10 group-hover/space:opacity-25 transition-opacity" />

          {/* Tooltip */}
          {showSpaceTooltip && (
            <div className="absolute bottom-12 left-0 md:left-auto md:right-0 mb-2 px-3 py-2 bg-[#4070E0] text-white text-xs font-bold rounded-xl shadow-xl shadow-[#4070E0]/30 whitespace-nowrap animate-in fade-in-0 zoom-in-95 slide-in-from-bottom-2 duration-300">
              Visit Your Space
              {/* Arrow - aligned left on mobile, right on desktop */}
              <div className="absolute top-full left-4 md:left-auto md:right-4 w-0 h-0 border-l-[6px] border-r-[6px] border-t-[6px] border-transparent border-t-[#4070E0]"></div>
            </div>
          )}

          <Link
            href="/account/my-space"
            className="flex items-center justify-center w-11 h-11 bg-[#4070E0] text-white rounded-full shadow-lg hover:shadow-[#4070E0]/40 transition-all duration-300 hover:scale-110 active:scale-95 relative overflow-hidden ring-2 ring-white/20"
            onMouseEnter={() => setShowSpaceTooltip(true)}
            onMouseLeave={() => setShowSpaceTooltip(false)}
            aria-label="Visit My Space"
          >
            {/* Subtle sweep effect */}
            <div className="absolute inset-0 bg-white/20 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out" />

            <LayoutDashboard className="w-5 h-5 transition-transform duration-300 group-hover:rotate-12" />
          </Link>
        </div>
      </div>

      {/* WhatsApp Button - Always Bottom Right */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col items-center">
        <div className="relative">
          {/* Tooltip */}
          {showWhatsAppTooltip && (
            <div className="absolute bottom-full right-0 mb-2 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg shadow-lg whitespace-nowrap animate-in fade-in-0 zoom-in-95 duration-200">
              Need help? Reach out to us.
              <div className="absolute top-full right-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
            </div>
          )}

          <Link
            href="https://wa.me/255748624684"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center w-11 h-11 bg-green-500 hover:bg-green-600 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110 group"
            onMouseEnter={() => setShowWhatsAppTooltip(true)}
            onMouseLeave={() => setShowWhatsAppTooltip(false)}
            aria-label="Contact us on WhatsApp"
          >
            {/* WhatsApp SVG Icon */}
            <svg
              className="w-6 h-6"
              viewBox="0 0 24 24"
              fill="currentColor"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.893 3.488" />
            </svg>
          </Link>
        </div>
      </div>
    </>
  )
}
