'use client'

import { useState, useRef } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { 
  Mail, 
  Phone, 
  MapPin, 
  Clock, 
  MessageCircle,
  Send,
  CheckCircle,
  ChevronLeft,
  ChevronRight
} from 'lucide-react'
import { PageLayout, Breadcrumb } from '@/components/shared'

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  })
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [currentSlide, setCurrentSlide] = useState(0)
  const sliderRef = useRef<HTMLDivElement>(null)

  const supportCards = [
    {
      icon: MessageCircle,
      iconColor: 'text-blue-600',
      bgColor: 'bg-blue-100',
      title: 'Live Chat',
      description: 'Chat with our support team in real-time for immediate assistance.',
      buttonText: 'Start Chat'
    },
    {
      icon: Phone,
      iconColor: 'text-green-600',
      bgColor: 'bg-green-100',
      title: 'Phone Support',
      description: 'Speak directly with our customer service representatives.',
      buttonText: 'Call Now'
    },
    {
      icon: Mail,
      iconColor: 'text-purple-600',
      bgColor: 'bg-purple-100',
      title: 'Email Support',
      description: 'Send us an email and we\'ll respond within 24 hours.',
      buttonText: 'Send Email'
    }
  ]

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % supportCards.length)
  }

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + supportCards.length) % supportCards.length)
  }

  const goToSlide = (index: number) => {
    setCurrentSlide(index)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/contact-messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })
      let data: { error?: string; message?: string } = {}
      try {
        data = await res.json()
      } catch {}
      if (!res.ok) {
        throw new Error((data && (data.error || data.message)) || 'Failed to send message')
      }
      setIsSubmitted(true)
      setFormData({ name: '', email: '', subject: '', message: '' })
      setTimeout(() => setIsSubmitted(false), 4000)
    } catch (err) {
      setError((err as Error)?.message || 'Failed to send message')
    } finally {
      setIsLoading(false)
    }
  }

  const breadcrumbItems = [
    { label: 'Home', href: '/' },
    { label: 'Contact Us' }
  ]

  return (
    <PageLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb */}
        <Breadcrumb items={breadcrumbItems} className="mb-8" />

        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Get in Touch</h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            We&apos;d love to hear from you. Send us a message and we&apos;ll respond as soon as possible.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Contact Information */}
          <div className="lg:col-span-1">
            <div className="space-y-6">
              {/* Contact Methods */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MessageCircle className="h-5 w-5 text-blue-600" />
                    Contact Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-start gap-3">
                    <Mail className="h-5 w-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="font-medium text-gray-900">Email</p>
                      <p className="text-gray-600">support@tiscomarket.com</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <Phone className="h-5 w-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="font-medium text-gray-900">Phone</p>
                      <p className="text-gray-600">+255 XXX XXX XXX</p>
                      <p className="text-gray-600">+255 XXX XXX XXX</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <MapPin className="h-5 w-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="font-medium text-gray-900">Address</p>
                      <p className="text-gray-600">
                        123 xxxxx Street<br />
                        xxxxxx District<br />
                       Dar es salaam, Tanzania
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <Clock className="h-5 w-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="font-medium text-gray-900">Office Hours</p>
                      <p className="text-gray-600">
                        Monday - Friday: 9:00 AM - 6:00 PM<br />
                        Saturday: 10:00 AM - 4:00 PM<br />
                        Sunday: Closed
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Quick Help */}
              <Card>
                <CardHeader>
                  <CardTitle>Quick Help</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Link href="/faq" className="block p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                    <p className="font-medium text-gray-900">Frequently Asked Questions</p>
                    <p className="text-sm text-gray-600">Find answers to common questions</p>
                  </Link>
                  
                  <Link href="/delivery-guide" className="block p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                    <p className="font-medium text-gray-900">Delivery Guide</p>
                    <p className="text-sm text-gray-600">How delivery works and what to expect</p>
                  </Link>
                  
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Contact Form */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Send us a Message</CardTitle>
              </CardHeader>
              <CardContent>
                {isSubmitted ? (
                  <div className="text-center py-8">
                    <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">Message Sent!</h3>
                    <p className="text-gray-600">
                      Thank you for contacting us. We&apos;ll get back to you within 24 hours.
                    </p>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <Label htmlFor="name">Full Name *</Label>
                        <Input
                          id="name"
                          name="name"
                          value={formData.name}
                          onChange={handleInputChange}
                          placeholder="Your full name"
                          autoComplete="name"
                          required
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="email">Email Address *</Label>
                        <Input
                          id="email"
                          name="email"
                          type="email"
                          value={formData.email}
                          onChange={handleInputChange}
                          placeholder="your.email@example.com"
                          autoComplete="email"
                          required
                        />
                      </div>
                    </div>
                    
                    <div>
                      <Label htmlFor="subject">Subject *</Label>
                      <Input
                        id="subject"
                        name="subject"
                        value={formData.subject}
                        onChange={handleInputChange}
                        placeholder="What is this regarding?"
                        required
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="message">Message *</Label>
                      <Textarea
                        id="message"
                        name="message"
                        value={formData.message}
                        onChange={handleInputChange}
                        placeholder="Please provide details about your inquiry..."
                        rows={6}
                        required
                      />
                    </div>
                    
                    {error && (
                      <p className="text-red-600 text-sm">{error}</p>
                    )}
                    <Button type="submit" size="lg" className="w-full" disabled={isLoading}>
                      <Send className="h-4 w-4 mr-2" />
                      {isLoading ? 'Sending...' : 'Send Message'}
                    </Button>
                  </form>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Additional Support Options */}
        <section className="mt-16">
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-8">
            Other Ways to Get Support
          </h2>
          
          {/* Desktop Grid View */}
          <div className="hidden md:grid grid-cols-1 md:grid-cols-3 gap-6">
            {supportCards.map((card, index) => {
              const IconComponent = card.icon
              return (
                <Card key={index} className="text-center hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className={`w-16 h-16 ${card.bgColor} rounded-full flex items-center justify-center mx-auto mb-4`}>
                      <IconComponent className={`h-8 w-8 ${card.iconColor}`} />
                    </div>
                    <h3 className="font-semibold text-gray-900 mb-2">{card.title}</h3>
                    <p className="text-gray-600 mb-4">
                      {card.description}
                    </p>
                    <Button variant="outline" size="sm">
                      {card.buttonText}
                    </Button>
                  </CardContent>
                </Card>
              )
            })}
          </div>

          {/* Mobile Slider View */}
          <div className="md:hidden relative">
            <div className="overflow-hidden" ref={sliderRef}>
              <div 
                className="flex transition-transform duration-300 ease-in-out"
                style={{ transform: `translateX(-${currentSlide * 100}%)` }}
              >
                {supportCards.map((card, index) => {
                  const IconComponent = card.icon
                  return (
                    <div key={index} className="w-full flex-shrink-0 px-4">
                      <Card className="text-center hover:shadow-lg transition-shadow">
                        <CardContent className="p-6">
                          <div className={`w-16 h-16 ${card.bgColor} rounded-full flex items-center justify-center mx-auto mb-4`}>
                            <IconComponent className={`h-8 w-8 ${card.iconColor}`} />
                          </div>
                          <h3 className="font-semibold text-gray-900 mb-2">{card.title}</h3>
                          <p className="text-gray-600 mb-4">
                            {card.description}
                          </p>
                          <Button variant="outline" size="sm">
                            {card.buttonText}
                          </Button>
                        </CardContent>
                      </Card>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Navigation Arrows */}
            <button
              onClick={prevSlide}
              className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-2 bg-white rounded-full p-2 shadow-lg border border-gray-200 hover:bg-gray-50 transition-colors z-10"
              aria-label="Previous support option"
            >
              <ChevronLeft className="h-5 w-5 text-gray-600" />
            </button>
            
            <button
              onClick={nextSlide}
              className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-2 bg-white rounded-full p-2 shadow-lg border border-gray-200 hover:bg-gray-50 transition-colors z-10"
              aria-label="Next support option"
            >
              <ChevronRight className="h-5 w-5 text-gray-600" />
            </button>

            {/* Dots Indicator */}
            <div className="flex justify-center mt-6 space-x-2">
              {supportCards.map((_, index) => (
                <button
                  key={index}
                  onClick={() => goToSlide(index)}
                  className={`w-2 h-2 rounded-full transition-colors ${
                    index === currentSlide ? 'bg-blue-600' : 'bg-gray-300'
                  }`}
                  aria-label={`Go to slide ${index + 1}`}
                />
              ))}
            </div>
          </div>
        </section>
      </div>
    </PageLayout>
  )
}
