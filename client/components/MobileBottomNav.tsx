'use client'

import { usePathname, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Home, Store, LayoutDashboard, Wrench, User, LucideIcon } from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'
import { useState } from 'react'
import { AuthModal } from '@/components/auth/AuthModal'

interface NavItem {
  href: string
  label: string
  icon: LucideIcon
  isCenter?: boolean
}

/**
 * Navigation items for the mobile bottom bar
 * My Space is the center elevated item (index 2)
 */
const NAV_ITEMS: NavItem[] = [
  { href: '/', label: 'Home', icon: Home },
  { href: '/products', label: 'Shop', icon: Store },
  { href: '/account/my-space', label: 'My Space', icon: LayoutDashboard, isCenter: true },
  { href: '/services', label: 'Services', icon: Wrench },
  { href: '/account', label: 'Account', icon: User },
]

/**
 * Mobile Bottom Navigation Bar
 * 
 * Fixed bottom navigation visible only on mobile (md:hidden).
 * Features a center-elevated "My Space" FAB button.
 * Requires auth for My Space and Account — shows auth modal if not signed in.
 */
export const MobileBottomNav = () => {
  const pathname = usePathname()
  const router = useRouter()
  const { user, loading } = useAuth()
  const [showAuthModal, setShowAuthModal] = useState(false)

  // Don't show on checkout or admin pages
  const hiddenPaths = ['/checkout', '/admin', '/auth']
  if (hiddenPaths.some(p => pathname.startsWith(p))) return null

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/'
    return pathname.startsWith(href)
  }

  const handleNavClick = (e: React.MouseEvent, href: string) => {
    // Protected routes require authentication
    const protectedPaths = ['/account', '/account/my-space']
    if (protectedPaths.includes(href) && !loading && !user) {
      e.preventDefault()
      setShowAuthModal(true)
    }
  }

  return (
    <>
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 z-[55] bg-white/95 backdrop-blur-md border-t border-gray-200 shadow-[0_-2px_10px_rgba(0,0,0,0.06)]"
        role="navigation"
        aria-label="Mobile navigation"
      >
        <div className="flex items-end justify-around px-2 pb-[env(safe-area-inset-bottom)]">
          {NAV_ITEMS.map(({ href, label, icon: Icon, isCenter }) => {
            const active = isActive(href)

            if (isCenter) {
              // Center elevated FAB button for "My Space"
              return (
                <Link
                  key={href}
                  href={href}
                  onClick={(e) => handleNavClick(e, href)}
                  className="flex flex-col items-center -mt-5 group"
                  aria-label={label}
                  aria-current={active ? 'page' : undefined}
                >
                  {/* Elevated circle */}
                  <span
                    className={`
                      flex items-center justify-center w-14 h-14 rounded-full shadow-lg
                      transition-all duration-200
                      ${active
                        ? 'bg-blue-600 shadow-blue-300/50 scale-105'
                        : 'bg-gray-900 shadow-gray-400/30 group-active:scale-95'
                      }
                    `}
                  >
                    <Icon className="w-7 h-7 text-white" />
                  </span>
                  <span
                    className={`text-[10px] mt-1 font-semibold transition-colors duration-200 ${
                      active ? 'text-blue-600' : 'text-gray-500'
                    }`}
                  >
                    {label}
                  </span>
                </Link>
              )
            }

            // Regular nav items
            return (
              <Link
                key={href}
                href={href}
                onClick={(e) => handleNavClick(e, href)}
                className={`
                  flex flex-col items-center py-2 px-3 min-w-[56px]
                  transition-all duration-200 group
                  active:scale-95
                `}
                aria-label={label}
                aria-current={active ? 'page' : undefined}
              >
                <Icon
                  className={`w-6 h-6 transition-colors duration-200 ${
                    active ? 'text-blue-600' : 'text-gray-400 group-hover:text-gray-600'
                  }`}
                />
                <span
                  className={`text-[10px] mt-0.5 font-medium transition-colors duration-200 ${
                    active ? 'text-blue-600' : 'text-gray-400 group-hover:text-gray-600'
                  }`}
                >
                  {label}
                </span>
              </Link>
            )
          })}
        </div>
      </nav>

      {/* Auth modal for protected nav items */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        defaultMode="signin"
      />
    </>
  )
}
