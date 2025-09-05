'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { 
  Search, 
  ChevronDown, 
  ChevronUp,
  MessageCircle,
  Mail,
  Phone
} from 'lucide-react'
import { Navbar } from '@/components/Navbar'
import { Footer } from '@/components/Footer'
import { CartSidebar } from '@/components/CartSidebar'

interface FAQ {
  id: string
  question: string
  answer: string
  category: string
}

const faqs: FAQ[] = [
  {
    id: '1',
    question: 'How will I know when my order ships?',
    answer: 'You&apos;ll receive an email confirmation once your order ships with delivery timeline information. Check our delivery FAQs for more details about processing and shipping times.',
    category: 'Orders & Shipping'
  },
  {
    id: '2',
    question: 'What is your return policy?',
    answer: 'We do not offer returns unless the product arrives damaged, defective, or incorrect. If you experience an issue with your order, please contact our customer service team for assistance.',
    category: 'Returns & Exchanges'
  },
  {
    id: '3',
    question: 'How long does delivery take?',
    answer: 'Standard delivery takes 3-7 business days. Express delivery (1-3 business days) is available for an additional fee.',
    category: 'Orders & Shipping'
  },
  {
    id: '4',
    question: 'Do you delivery internationally?',
    answer: 'We don’t currently ship internationally, but special arrangements can sometimes be made. Please contact us directly to discuss your order and options.',
    category: 'Orders & Shipping'
  },
  {
    id: '5',
    question: 'How can I change or cancel my order?',
    answer: 'Once an order has been paid, we do not offer refunds. If you need assistance with your order, please contact our office directly, and we will do our best to help.',
    category: 'Orders & Shipping'
  },
  {
    id: '6',
    question: 'What payment methods do you accept?',
    answer: 'We accept a variety of payment methods for your convenience, including Mobile Money, major credit cards (Visa, MasterCard), and cash payments at our office. All online transactions are processed securely.',
    category: 'Payment'
  },
  {
    id: '7',
    question: 'Is my payment information secure?',
    answer: 'Yes, we use industry-standard SSL encryption to protect your payment information. We are PCI DSS compliant and never store your complete credit card information on our servers.',
    category: 'Payment'
  },
  {
    id: '8',
    question: 'How do I create an account?',
    answer: 'Click the "Sign Up" button in the top right corner of any page. You can also create an account during checkout. Having an account allows you to view order history, save favorites, and speed up future purchases.',
    category: 'Account'
  },
  {
    id: '9',
    question: 'I forgot my password. How can I reset it?',
    answer: 'Click "Sign In" and then "Forgot Password". Enter your email address and we will send you a reset link. The link will be valid for 24 hours.',
    category: 'Account'
  },
  {
    id: '10',
    question: 'How can I update my account information?',
    answer: 'Log in to your account and click on "Account Settings". You can update your personal information, shipping addresses, and communication preferences.',
    category: 'Account'
  },
  {
    id: '11',
    question: 'Are your products authentic?',
    answer: 'Yes, all our products are 100% authentic. We also work directly with manufacturers and authorized distributors. Every product comes with a guarantee of authenticity.',
    category: 'Products'
  },
  {
    id: '12',
    question: 'Do you offer warranties on products?',
    answer: 'Warranty coverage varies by product and manufacturer. Most electronics come with manufacturer warranties. Please check the product page for specific warranty information.',
    category: 'Products'
  },
  {
    id: '13',
    question: 'How can I leave a product review?',
    answer: 'You can leave a review after purchasing and receiving a product. Go to your order history, find the product, and click "Write a Review". Reviews help other customers make informed decisions.',
    category: 'Products'
  },
  {
    id: '14',
    question: 'Do you offer price matching?',
    answer: 'Yes, we offer price matching on identical items from competing retailers. The item must be in stock and the price must be publicly available. Contact customer service with details.',
    category: 'Pricing'
  },
  {
    id: '15',
    question: 'How do I contact customer service?',
    answer: 'You can contact us via live chat, email at support@tiscomarket.com, or phone at (555) 123-4567. Our support team is available Monday-Friday 9AM-6PM, Saturday 10AM-4PM.',
    category: 'Support'
  }
]

const categories = Array.from(new Set(faqs.map(faq => faq.category)))

export default function FAQPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [expandedItems, setExpandedItems] = useState<string[]>([])

  const toggleExpanded = (id: string) => {
    setExpandedItems(prev => 
      prev.includes(id) 
        ? prev.filter(item => item !== id)
        : [...prev, id]
    )
  }

  const filteredFAQs = faqs.filter(faq => {
    const matchesSearch = faq.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         faq.answer.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = selectedCategory === 'all' || faq.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  const groupedFAQs = categories.reduce((acc, category) => {
    acc[category] = filteredFAQs.filter(faq => faq.category === category)
    return acc
  }, {} as Record<string, FAQ[]>)

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb */}
        <nav className="flex items-center space-x-2 text-sm text-gray-600 mb-8">
          <Link href="/" className="hover:text-blue-600">Home</Link>
          <span>/</span>
          <span className="text-gray-900">FAQ</span>
        </nav>

        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Frequently Asked Questions
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Find answers to common questions about shopping, shipping, returns, and more.
          </p>
        </div>

        {/* Search and Filter */}
        <div className="mb-8 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <Input
              placeholder="Search FAQs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 text-lg py-3"
            />
          </div>
          
          <div className="flex flex-wrap gap-2">
            <Button
              variant={selectedCategory === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedCategory('all')}
            >
              All Categories
            </Button>
            {categories.map((category) => (
              <Button
                key={category}
                variant={selectedCategory === category ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedCategory(category)}
              >
                {category}
              </Button>
            ))}
          </div>
        </div>

        {/* FAQ Content */}
        {selectedCategory === 'all' ? (
          // Show grouped by category
          <div className="space-y-8">
            {Object.entries(groupedFAQs).map(([category, categoryFAQs]) => (
              categoryFAQs.length > 0 && (
                <section key={category}>
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">{category}</h2>
                  <div className="space-y-4">
                    {categoryFAQs.map((faq) => (
                      <Card key={faq.id} className="hover:shadow-md transition-shadow">
                        <CardContent className="p-0">
                          <button
                            onClick={() => toggleExpanded(faq.id)}
                            className="w-full p-6 text-left hover:bg-gray-50 transition-colors"
                          >
                            <div className="flex items-center justify-between">
                              <h3 className="font-semibold text-gray-900 pr-4">
                                {faq.question}
                              </h3>
                              {expandedItems.includes(faq.id) ? (
                                <ChevronUp className="h-5 w-5 text-gray-500 flex-shrink-0" />
                              ) : (
                                <ChevronDown className="h-5 w-5 text-gray-500 flex-shrink-0" />
                              )}
                            </div>
                          </button>
                          
                          {expandedItems.includes(faq.id) && (
                            <div className="px-6 pb-6">
                              <div className="h-px bg-gray-200 mb-4"></div>
                              <p className="text-gray-600 leading-relaxed">
                                {faq.answer}
                              </p>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </section>
              )
            ))}
          </div>
        ) : (
          // Show selected category only
          <div className="space-y-4">
            {filteredFAQs.map((faq) => (
              <Card key={faq.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-0">
                  <button
                    onClick={() => toggleExpanded(faq.id)}
                    className="w-full p-6 text-left hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-gray-900 pr-4">
                        {faq.question}
                      </h3>
                      {expandedItems.includes(faq.id) ? (
                        <ChevronUp className="h-5 w-5 text-gray-500 flex-shrink-0" />
                      ) : (
                        <ChevronDown className="h-5 w-5 text-gray-500 flex-shrink-0" />
                      )}
                    </div>
                  </button>
                  
                  {expandedItems.includes(faq.id) && (
                    <div className="px-6 pb-6">
                      <div className="h-px bg-gray-200 mb-4"></div>
                      <p className="text-gray-600 leading-relaxed">
                        {faq.answer}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {filteredFAQs.length === 0 && (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16">
              <Search className="h-16 w-16 text-gray-300 mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No FAQs found</h3>
              <p className="text-gray-600 text-center mb-6">
                Try adjusting your search terms or browse different categories.
              </p>
              <Button onClick={() => { setSearchTerm(''); setSelectedCategory('all') }}>
                Clear Filters
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Still Need Help Section */}
        <section className="mt-16">
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="p-8 text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Still need help?
              </h2>
              <p className="text-gray-600 mb-6">
                Can&apos;t find what you&apos;re looking for? Our support team is here to help.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Button asChild variant="outline" className="h-auto py-4">
                  <Link href="/contact" className="flex flex-col items-center gap-2">
                    <MessageCircle className="h-6 w-6" />
                    <span>Live Chat</span>
                  </Link>
                </Button>
                
                <Button asChild variant="outline" className="h-auto py-4">
                  <a href="mailto:support@tiscomarket.com" className="flex flex-col items-center gap-2">
                    <Mail className="h-6 w-6" />
                    <span>Email Support</span>
                  </a>
                </Button>
                
                <Button asChild variant="outline" className="h-auto py-4">
                  <a href="tel:+15551234567" className="flex flex-col items-center gap-2">
                    <Phone className="h-6 w-6" />
                    <span>Phone Support</span>
                  </a>
                </Button>
              </div>
            </CardContent>
          </Card>
        </section>
      </div>

      <Footer />
      <CartSidebar />
    </div>
  )
}
