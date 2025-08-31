import React from 'react'
import { NavbarWrapper } from '@/components/NavbarWrapper'
import { Footer } from '@/components/Footer'
import { CartSidebar } from '@/components/CartSidebar'

interface PageLayoutProps {
  children: React.ReactNode
  className?: string
  showBreadcrumb?: boolean
  breadcrumbItems?: { label: string; href?: string }[]
}

export const PageLayout: React.FC<PageLayoutProps> = ({ 
  children, 
  className = "min-h-screen bg-gray-50",
  showBreadcrumb = false,
  breadcrumbItems = []
}) => {
  return (
    <div className={className}>
      <NavbarWrapper />
      
      {showBreadcrumb && breadcrumbItems.length > 0 && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <nav className="flex items-center space-x-2 text-sm text-gray-600">
            {breadcrumbItems.map((item, index) => (
              <React.Fragment key={index}>
                {index > 0 && <span>/</span>}
                {item.href ? (
                  <a href={item.href} className="hover:text-blue-600">
                    {item.label}
                  </a>
                ) : (
                  <span className={index === breadcrumbItems.length - 1 ? "text-gray-900" : ""}>
                    {item.label}
                  </span>
                )}
              </React.Fragment>
            ))}
          </nav>
        </div>
      )}
      
      <main>{children}</main>
      
      <Footer />
      <CartSidebar />
    </div>
  )
}
