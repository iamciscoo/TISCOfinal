import Link from 'next/link'
import Image from 'next/image'
import { Facebook, Twitter, Instagram, Mail, Phone, MapPin } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { NewsletterForm } from '@/components/NewsletterForm'

export const Footer = () => {
  return (
    <footer className="bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Main Footer Content */}
        <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8 py-8 sm:py-12 md:py-16">
          {/* Company Info */}
          <div className="col-span-2 md:col-span-1 space-y-3 sm:space-y-4">
            <div className="flex items-center space-x-3">
              <Image
                src="/circular.svg"
                alt="TISCO Market Logo"
                width={32}
                height={32}
                className="w-8 h-8"
              />
              <span className="text-lg sm:text-xl font-bold font-chango">TISCOマーケット</span>
            </div>
            <p className="text-gray-400 text-sm leading-snug sm:leading-relaxed">
              No Bullshit. No Excuses. No Fluff. Just What You Need.
              <br className="hidden sm:block" />
              <span className="hidden sm:inline">Quality products delivered fast without the corporate runaround.</span>
            </p>
            <div className="flex space-x-3 sm:space-x-4">
              <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white p-2">
                <Facebook className="h-4 w-4 sm:h-5 sm:w-5" />
              </Button>
              <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white p-2">
                <Twitter className="h-4 w-4 sm:h-5 sm:w-5" />
              </Button>
              <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white p-2">
                <Instagram className="h-4 w-4 sm:h-5 sm:w-5" />
              </Button>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-3 sm:space-y-4">
            <h3 className="text-base sm:text-lg font-semibold">Quick Links</h3>
            <ul className="space-y-1 sm:space-y-2">
              <li>
                <Link href="/products" className="text-gray-400 hover:text-white transition-colors text-xs sm:text-sm">
                  Shop
                </Link>
              </li>
              <li>
                <Link href="/services" className="text-gray-400 hover:text-white transition-colors text-xs sm:text-sm">
                  Services
                </Link>
              </li>
              <li>
                <Link href="/deals" className="text-gray-400 hover:text-white transition-colors text-xs sm:text-sm">
                  Special Deals
                </Link>
              </li>
              <li>
                <Link href="/about" className="text-gray-400 hover:text-white transition-colors text-xs sm:text-sm">
                  About
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-gray-400 hover:text-white transition-colors text-xs sm:text-sm">
                  Contact
                </Link>
              </li>
            </ul>
          </div>

          {/* Customer Service */}
          <div className="space-y-3 sm:space-y-4">
            <h3 className="text-base sm:text-lg font-semibold">Customer Service</h3>
            <ul className="space-y-1 sm:space-y-2">
              <li>
                <Link href="/contact" className="text-gray-400 hover:text-white transition-colors text-xs sm:text-sm">
                  Contact Us
                </Link>
              </li>
              <li>
                <Link href="/faq" className="text-gray-400 hover:text-white transition-colors text-xs sm:text-sm">
                  FAQ
                </Link>
              </li>
              <li>
                <Link href="/delivery-guide" className="text-gray-400 hover:text-white transition-colors text-xs sm:text-sm">
                  Delivery Guide
                </Link>
              </li>
            </ul>
          </div>

          {/* Newsletter & Contact */}
          <div className="col-span-2 md:col-span-1 space-y-3 sm:space-y-4">
            <h3 className="text-base sm:text-lg font-semibold">Stay Connected</h3>
            <p className="text-gray-400 text-xs sm:text-sm">
              Subscribe to get special offers, free giveaways, and updates.
            </p>
            
            {/* Newsletter Signup */}
            <NewsletterForm />

            {/* Contact Info */}
            <div className="space-y-1 sm:space-y-2 pt-2 sm:pt-4">
              <div className="flex items-center space-x-2 text-xs sm:text-sm text-gray-400">
                <Mail className="h-3 w-3 sm:h-4 sm:w-4" />
                <span>support@tiscomarket.com</span>
              </div>
              <div className="flex items-center space-x-2 text-xs sm:text-sm text-gray-400">
                <Phone className="h-3 w-3 sm:h-4 sm:w-4" />
                <span>+255 XXX XXX XXX</span>
              </div>
              <div className="flex items-center space-x-2 text-xs sm:text-sm text-gray-400">
                <MapPin className="h-3 w-3 sm:h-4 sm:w-4" />
                <span>Dar es salaam, Tanzania</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Footer */}
        <div className="border-t border-gray-800 py-6 sm:py-8">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-3 md:space-y-0">
            <div className="text-xs sm:text-sm text-gray-400">
              © 2024 TISCO Market. All rights reserved.
            </div>
            <div className="flex space-x-4 sm:space-x-6">
              <Link href="/privacy" className="text-xs sm:text-sm text-gray-400 hover:text-white transition-colors">
                Privacy Policy
              </Link>
              <Link href="/terms" className="text-xs sm:text-sm text-gray-400 hover:text-white transition-colors">
                Terms of Service
              </Link>
              <Link href="/cookies" className="text-xs sm:text-sm text-gray-400 hover:text-white transition-colors">
                Cookie Policy
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
