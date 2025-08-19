import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowRight, ShoppingBag, Star } from 'lucide-react'

export const HeroSection = () => {
  return (
    <section className="relative bg-gradient-to-br from-blue-50 via-white to-purple-50 min-h-[80vh] flex items-center">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <div className="space-y-8">
            <div className="space-y-4">
              <div className="inline-flex items-center space-x-2 bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                <Star className="h-4 w-4" />
                <span>Trusted by 10,000+ customers</span>
              </div>
              
              <h1 className="text-4xl md:text-6xl font-bold text-gray-900 leading-tight">
                Your Trusted
                <span className="text-blue-600 block">Online Market</span>
              </h1>
              
              <p className="text-xl text-gray-600 leading-relaxed max-w-lg">
                Discover quality products at unbeatable prices. From electronics to fashion, 
                we have everything you need with fast delivery and excellent customer service.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <Button asChild size="lg" className="text-lg px-8 py-6">
                <Link href="/products">
                  <ShoppingBag className="h-5 w-5 mr-2" />
                  Shop Now
                  <ArrowRight className="h-5 w-5 ml-2" />
                </Link>
              </Button>
              
              <Button variant="outline" size="lg" className="text-lg px-8 py-6">
                <Link href="/services">
                  Our Services
                </Link>
              </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-8 pt-8 border-t border-gray-200">
              <div className="text-center sm:text-left">
                <div className="text-2xl md:text-3xl font-bold text-gray-900">50K+</div>
                <div className="text-sm text-gray-600">Products</div>
              </div>
              <div className="text-center sm:text-left">
                <div className="text-2xl md:text-3xl font-bold text-gray-900">10K+</div>
                <div className="text-sm text-gray-600">Happy Customers</div>
              </div>
              <div className="text-center sm:text-left">
                <div className="text-2xl md:text-3xl font-bold text-gray-900">99%</div>
                <div className="text-sm text-gray-600">Satisfaction Rate</div>
              </div>
            </div>
          </div>

          {/* Right Content - Hero Image */}
          <div className="relative">
            <div className="relative z-10">
              {/* Main Product Showcase */}
              <div className="bg-white rounded-2xl shadow-2xl p-8 transform rotate-3 hover:rotate-0 transition-transform duration-300">
                <div className="aspect-square bg-gradient-to-br from-blue-100 to-purple-100 rounded-xl flex items-center justify-center mb-4">
                  <div className="w-32 h-32 bg-blue-600 rounded-lg flex items-center justify-center">
                    <ShoppingBag className="h-16 w-16 text-white" />
                  </div>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Premium Products</h3>
                <p className="text-gray-600">Quality guaranteed items</p>
                <div className="flex items-center justify-between mt-4">
                  <span className="text-2xl font-bold text-blue-600">$99.99</span>
                  <Button size="sm">Add to Cart</Button>
                </div>
              </div>

              {/* Floating Elements */}
              <div className="absolute -top-4 -left-4 bg-green-500 text-white px-3 py-1 rounded-full text-sm font-medium shadow-lg">
                Free Shipping
              </div>
              <div className="absolute -bottom-4 -right-4 bg-orange-500 text-white px-3 py-1 rounded-full text-sm font-medium shadow-lg">
                24/7 Support
              </div>
            </div>

            {/* Background Decorations */}
            <div className="absolute inset-0 bg-gradient-to-br from-blue-200/20 to-purple-200/20 rounded-2xl transform -rotate-6"></div>
            <div className="absolute -top-8 -right-8 w-32 h-32 bg-blue-200/30 rounded-full"></div>
            <div className="absolute -bottom-8 -left-8 w-24 h-24 bg-purple-200/30 rounded-full"></div>
          </div>
        </div>
      </div>
    </section>
  )
}
