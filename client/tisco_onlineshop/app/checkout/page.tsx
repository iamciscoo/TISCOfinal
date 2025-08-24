'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useCurrency } from '@/lib/currency-context'
import { Separator } from '@/components/ui/separator'
import { useToast } from '@/hooks/use-toast'
import { 
  ArrowLeft, 
  ArrowRight, 
  Check, 
  CreditCard, 
  MapPin,
  Package,
  Shield,
  Truck
} from 'lucide-react'
import { useCartStore } from '@/lib/store'
import { Navbar } from '@/components/Navbar'
import { useUser } from '@clerk/nextjs'

type CheckoutStep = 'shipping' | 'payment' | 'review'

type PaymentMethod = 'mobile' | 'card' | 'office'
type PaymentData = {
  method: PaymentMethod
  provider: string
  mobilePhone: string
  cardNumber: string
  expiryDate: string
  cvv: string
  nameOnCard: string
  billingAddressSame: boolean
}

// Top cities in Tanzania for quick selection
const TOP_TZ_CITIES = [
  'Dar es Salaam',
  'Arusha',
  'Dodoma',
  'Mwanza',
  'Mbeya',
  'Morogoro',
  'Tanga',
  'Moshi',
  'Zanzibar City',
  'Kigoma',
  'Tabora',
  'Iringa',
  'Shinyanga',
  'Mtwara'
]

export default function CheckoutPage() {
  const router = useRouter()
  const { user } = useUser()
  const { items, clearCart, getTotalPrice, getTotalItems } = useCartStore()
  const { toast } = useToast()
  const [currentStep, setCurrentStep] = useState<CheckoutStep>('shipping')
  const [isProcessing, setIsProcessing] = useState(false)

  // Avoid hydration mismatch by deferring persisted cart reads until after mount
  const [mounted, setMounted] = useState(false)
  useEffect(() => { setMounted(true) }, [])

  // Form data
  const [shippingData, setShippingData] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.emailAddresses[0]?.emailAddress || '',
    phone: '',
    address: '',
    city: '', // Selected from dropdown, can be 'Other'
    otherCity: '', // User-provided when city is 'Other'
    place: '', // Area/ward within the city
    country: 'Tanzania',
    deliveryMethod: 'delivery' // 'delivery' | 'pickup'
  })

  const [paymentData, setPaymentData] = useState<PaymentData>({
    method: 'mobile',
    provider: '',
    mobilePhone: '',
    cardNumber: '',
    expiryDate: '',
    cvv: '',
    nameOnCard: '',
    billingAddressSame: true
  })

  // Normalize legacy provider value if it was previously set to 'MixxByYas'
  useEffect(() => {
    if (paymentData.provider === 'MixxByYas') {
      setPaymentData(prev => ({ ...prev, provider: 'Tigo Pesa' }))
    }
  }, [paymentData.provider])

  const { formatPrice } = useCurrency()
  const totalItems = mounted ? getTotalItems() : 0
  const subtotal = mounted ? getTotalPrice() : 0
  const displayItems = mounted ? items : []
  const selectedCity = (shippingData.city === 'Other' ? shippingData.otherCity : shippingData.city).trim()
  const hasCity = selectedCity.length > 0
  const isDar = hasCity && selectedCity.toLowerCase() === 'dar es salaam'
  const isPickup = shippingData.deliveryMethod === 'pickup'
  // Delivery fee is paid upon delivery and not included in total
  const total = subtotal

  // Redirect if cart is empty (only after mounted to avoid early redirect before rehydration)
  useEffect(() => {
    if (mounted && items.length === 0) {
      router.push('/cart')
    }
  }, [mounted, items.length, router])

  // Redirect if not authenticated
  useEffect(() => {
    if (!user) {
      router.push('/sign-in?redirect_url=/checkout')
    }
  }, [user, router])

  const steps = [
    { id: 'shipping', title: 'Delivery', icon: MapPin },
    { id: 'payment', title: 'Payment', icon: CreditCard },
    { id: 'review', title: 'Review', icon: Package }
  ]

  const maskPhone = (phone: string) => {
    const sanitized = (phone || '').replace(/\s+/g, '')
    if (sanitized.length <= 3) return sanitized
    return '*'.repeat(Math.max(0, sanitized.length - 3)) + sanitized.slice(-3)
  }

  const handleNextStep = () => {
    if (currentStep === 'shipping') {
      setCurrentStep('payment')
    } else if (currentStep === 'payment') {
      setCurrentStep('review')
    }
  }

  const handlePreviousStep = () => {
    if (currentStep === 'payment') {
      setCurrentStep('shipping')
    } else if (currentStep === 'review') {
      setCurrentStep('payment')
    }
  }

  const handlePlaceOrder = async () => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to place your order.",
        variant: "destructive",
      })
      return
    }

    // Validate required fields
    const requiresDeliveryDetails = shippingData.deliveryMethod === 'delivery'
    if (
      !shippingData.firstName ||
      !shippingData.lastName ||
      !shippingData.email ||
      !shippingData.phone ||
      (requiresDeliveryDetails && (
        !shippingData.city ||
        (shippingData.city === 'Other' && !shippingData.otherCity) ||
        !shippingData.place
      ))
    ) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required delivery information.",
        variant: "destructive",
      })
      return
    }

    // Validate payment by method
    if (paymentData.method === 'card') {
      if (!paymentData.cardNumber || !paymentData.expiryDate || !paymentData.cvv || !paymentData.nameOnCard) {
        toast({
          title: "Missing Information", 
          description: "Please fill in all required card details.",
          variant: "destructive",
        })
        return
      }
    } else if (paymentData.method === 'mobile') {
      if (!paymentData.provider || !paymentData.mobilePhone) {
        toast({
          title: "Missing Information", 
          description: "Please select your mobile service and enter your phone number.",
          variant: "destructive",
        })
        return
      }
    }

    try {
      setIsProcessing(true)
      
      // Prepare order data
      let shipping_address = ''
      if (shippingData.deliveryMethod === 'pickup') {
        shipping_address = `${shippingData.firstName} ${shippingData.lastName}\nPhone: ${shippingData.phone}\nPickup: Office/Warehouse\n${shippingData.country}`
      } else {
        shipping_address = `${shippingData.firstName} ${shippingData.lastName}\n${shippingData.address}\n${shippingData.place}\n${selectedCity || 'Tanzania'}\n${shippingData.country}\nPhone: ${shippingData.phone}`
      }
      
      // Build payment summary
      let payment_method = ''
      let payment_summary = ''
      if (paymentData.method === 'card') {
        payment_method = `Card **** **** **** ${paymentData.cardNumber.slice(-4)}`
        payment_summary = `${paymentData.nameOnCard}`
      } else if (paymentData.method === 'mobile') {
        payment_method = `Mobile Money (${paymentData.provider}) - ${maskPhone(paymentData.mobilePhone)}`
        payment_summary = `Mobile Money (${paymentData.provider}) to ${paymentData.mobilePhone}`
      } else {
        payment_method = 'Pay at Office'
        payment_summary = 'Pay at office on pickup/delivery'
      }

      const orderData = {
        items: items.map(item => ({
          product_id: item.productId,
          quantity: item.quantity,
          price: item.price
        })),
        shipping_address,
        payment_method,
        currency: 'TZS',
        notes: `${shippingData.deliveryMethod === 'pickup' 
          ? `Delivery: Pickup (Free); Location: Office/Warehouse` 
          : `Delivery: ${hasCity ? (isDar ? 'Dar es Salaam' : 'Regional') : 'Not provided'} - ${hasCity ? (isDar ? 'TSH 5000 to 10000 (paid on delivery)' : formatPrice(15000)) : '—'}; Place: ${shippingData.place}; City: ${selectedCity || 'N/A'}`
        }; Payment: ${payment_summary}`,
        // Structured delivery fields for backend user sync
        contact_phone: shippingData.phone,
        address_line_1: shippingData.address,
        city: selectedCity,
        email: shippingData.email,
        place: shippingData.place,
        first_name: shippingData.firstName,
        last_name: shippingData.lastName,
        country: shippingData.country,
      }

      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderData),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to place order')
      }
      
      toast({
        title: "Order Placed!",
        description: `Order #${result.order.id.slice(0, 8)} has been placed successfully.`,
      })
      
      // Clear cart and redirect
      clearCart()
      router.push('/account/orders')
      
    } catch (error: unknown) {
      console.error('Error placing order:', error)
      toast({
        title: "Order Failed",
        description: (error as Error).message || "There was an error placing your order. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const isStepValid = (step: CheckoutStep) => {
    switch (step) {
      case 'shipping':
        return (
          !!shippingData.firstName &&
          !!shippingData.lastName &&
          !!shippingData.email &&
          !!shippingData.phone &&
          (shippingData.deliveryMethod === 'pickup' || (
            !!shippingData.city &&
            (shippingData.city !== 'Other' || !!shippingData.otherCity) &&
            !!shippingData.place
          ))
        )
      case 'payment':
        if (paymentData.method === 'card') {
          return !!(paymentData.cardNumber && paymentData.expiryDate && paymentData.cvv && paymentData.nameOnCard)
        }
        if (paymentData.method === 'mobile') {
          return !!(paymentData.provider && paymentData.mobilePhone)
        }
        return true
      default:
        return true
    }
  }

  if (mounted && items.length === 0) {
    return null // Will redirect via useEffect
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb */}
        <nav className="flex items-center space-x-2 text-sm text-gray-600 mb-8">
          <Link href="/" className="hover:text-blue-600">Home</Link>
          <span>/</span>
          <Link href="/cart" className="hover:text-blue-600">Cart</Link>
          <span>/</span>
          <span className="text-gray-900">Checkout</span>
        </nav>

        {/* Page Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Secure Checkout</h1>
          <p className="text-gray-600">Complete your order in a few simple steps</p>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-center mb-12">
          <div className="flex items-center space-x-8">
            {steps.map((step, index) => {
              const StepIcon = step.icon
              const isActive = currentStep === step.id
              const isCompleted = steps.findIndex(s => s.id === currentStep) > index
              
              return (
                <div key={step.id} className="flex items-center">
                  <div className="flex flex-col items-center">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center border-2 ${
                      isCompleted 
                        ? 'bg-green-500 border-green-500 text-white' 
                        : isActive 
                        ? 'bg-blue-500 border-blue-500 text-white'
                        : 'bg-white border-gray-300 text-gray-500'
                    }`}>
                      {isCompleted ? (
                        <Check className="h-6 w-6" />
                      ) : (
                        <StepIcon className="h-6 w-6" />
                      )}
                    </div>
                    <span className={`mt-2 text-sm font-medium ${
                      isActive ? 'text-blue-600' : isCompleted ? 'text-green-600' : 'text-gray-500'
                    }`}>
                      {step.title}
                    </span>
                  </div>
                  {index < steps.length - 1 && (
                    <div className={`w-16 h-0.5 mx-4 ${
                      isCompleted ? 'bg-green-500' : 'bg-gray-300'
                    }`} />
                  )}
                </div>
              )
            })}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* Shipping Information */}
            {currentStep === 'shipping' && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="h-5 w-5" />
                    Delivery Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="firstName">First Name *</Label>
                      <Input
                        id="firstName"
                        value={shippingData.firstName}
                        onChange={(e) => setShippingData(prev => ({ ...prev, firstName: e.target.value }))}
                        autoComplete="given-name"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="lastName">Last Name *</Label>
                      <Input
                        id="lastName"
                        value={shippingData.lastName}
                        onChange={(e) => setShippingData(prev => ({ ...prev, lastName: e.target.value }))}
                        autoComplete="family-name"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="email">Email *</Label>
                      <Input
                        id="email"
                        type="email"
                        value={shippingData.email}
                        onChange={(e) => setShippingData(prev => ({ ...prev, email: e.target.value }))}
                        autoComplete="email"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="phone">Phone Number *</Label>
                      <Input
                        id="phone"
                        type="tel"
                        value={shippingData.phone}
                        onChange={(e) => setShippingData(prev => ({ ...prev, phone: e.target.value }))}
                        autoComplete="tel"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="address">Address (optional)</Label>
                    <Input
                      id="address"
                      value={shippingData.address}
                      onChange={(e) => setShippingData(prev => ({ ...prev, address: e.target.value }))}
                      autoComplete="street-address"
                      disabled={isPickup}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="city">City *</Label>
                      <Select
                        value={shippingData.city || undefined}
                        onValueChange={(value) => setShippingData(prev => ({ ...prev, city: value }))}
                      >
                        <SelectTrigger className="w-full" disabled={isPickup}>
                          <SelectValue placeholder="Select city" />
                        </SelectTrigger>
                        <SelectContent>
                          {TOP_TZ_CITIES.map((c) => (
                            <SelectItem key={c} value={c}>{c}</SelectItem>
                          ))}
                          <SelectItem value="Other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                      {shippingData.city === 'Other' && (
                        <div className="mt-2">
                          <Label htmlFor="otherCity">Enter your city *</Label>
                          <Input
                            id="otherCity"
                            value={shippingData.otherCity}
                            onChange={(e) => setShippingData(prev => ({ ...prev, otherCity: e.target.value }))}
                            required={shippingData.deliveryMethod === 'delivery'}
                            disabled={isPickup}
                          />
                        </div>
                      )}
                    </div>
                    <div>
                      <Label htmlFor="place">Place *</Label>
                      <Input
                        id="place"
                        value={shippingData.place}
                        onChange={(e) => setShippingData(prev => ({ ...prev, place: e.target.value }))}
                        placeholder="e.g., Mikocheni, Mwenge, etc."
                        required={shippingData.deliveryMethod === 'delivery'}
                        disabled={isPickup}
                      />
                    </div>
                  </div>

                  {/* Delivery Method */}
                  <div className="mt-8">
                    <h3 className="text-lg font-semibold mb-4">Delivery Method</h3>
                    {/* Toggle between delivery and pickup */}
                    <div className="flex items-center gap-2 mb-3">
                      <Button
                        type="button"
                        variant={shippingData.deliveryMethod === 'delivery' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setShippingData(prev => ({ ...prev, deliveryMethod: 'delivery' }))}
                      >
                        Home/Office Delivery
                      </Button>
                      <Button
                        type="button"
                        variant={shippingData.deliveryMethod === 'pickup' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setShippingData(prev => ({ ...prev, deliveryMethod: 'pickup' }))}
                      >
                        Pickup (Free)
                      </Button>
                    </div>

                    <div className={`p-4 border rounded-lg flex items-center justify-between ${isPickup ? 'bg-green-50 border-green-200' : 'bg-blue-50 border-blue-200'}`}>
                      <div>
                        <div className="font-medium">
                          {isPickup
                            ? 'Pickup: Office/Warehouse'
                            : hasCity
                              ? (isDar ? 'Within Dar es Salaam' : 'Regional Delivery')
                              : 'Select your city'}
                        </div>
                        <div className="text-sm text-gray-600">
                          {isPickup
                            ? 'Collect your order from our office or warehouse for free.'
                            : hasCity
                              ? (isDar ? 'Delivery fee for Dar es Salaam' : 'Delivery fee for other regions')
                              : 'Delivery fee will be calculated after city selection'}
                        </div>
                      </div>
                      <div className="text-lg font-semibold">
                        {isPickup ? formatPrice(0) : (hasCity ? (isDar ? 'TSH 5000 to 10000' : formatPrice(15000)) : '—')}
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                      We will confirm the exact fee based on your area.
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Within Dar es Salaam: TSH 5000 to 10000. Other regions: TSH 15,000. Pickup is free.
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Delivery fee is paid upon delivery (cash or mobile money).
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Payment Information */}
            {currentStep === 'payment' && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5" />
                    Payment Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Method selector */}
                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      variant={paymentData.method === 'mobile' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setPaymentData(prev => ({ ...prev, method: 'mobile' }))}
                    >
                      Mobile Money
                    </Button>
                    <Button
                      type="button"
                      variant={paymentData.method === 'card' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setPaymentData(prev => ({ ...prev, method: 'card' }))}
                    >
                      Card (Visa/Mastercard)
                    </Button>
                    <Button
                      type="button"
                      variant={paymentData.method === 'office' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setPaymentData(prev => ({ ...prev, method: 'office' }))}
                    >
                      Pay at Office
                    </Button>
                  </div>

                  {/* Mobile Money */}
                  {paymentData.method === 'mobile' && (
                    <div className="space-y-4">
                      <div className="w-full rounded-lg overflow-hidden border bg-white">
                        <Image
                          src="/images/mobilepayment.png"
                          alt="Mobile payment methods"
                          width={1200}
                          height={200}
                          className="w-full h-32 object-contain bg-white"
                          priority
                        />
                      </div>
                      <div>
                        <Label>Mobile Service *</Label>
                        <Select
                          value={paymentData.provider || undefined}
                          onValueChange={(value) => setPaymentData(prev => ({ ...prev, provider: value }))}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select service" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="M-Pesa">M-Pesa</SelectItem>
                            <SelectItem value="Airtel Money">Airtel Money</SelectItem>
                            <SelectItem value="Tigo Pesa">Tigo Pesa / MixxByYas</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="mobilePhone">Phone Number *</Label>
                        <Input
                          id="mobilePhone"
                          type="tel"
                          placeholder="e.g., +255 7XX XXX XXX"
                          value={paymentData.mobilePhone}
                          onChange={(e) => setPaymentData(prev => ({ ...prev, mobilePhone: e.target.value }))}
                          autoComplete="tel"
                        />
                      </div>
                      <p className="text-xs text-gray-600">
                        You will receive a prompt on your phone to authorize the payment.
                      </p>
                    </div>
                  )}

                  {/* Card */}
                  {paymentData.method === 'card' && (
                    <div className="space-y-4">
                      <div className="w-full rounded-lg overflow-hidden border bg-white">
                        <Image
                          src="/images/visamastercard.png"
                          alt="Visa and Mastercard"
                          width={1200}
                          height={200}
                          className="w-full h-24 object-contain bg-white"
                          priority
                        />
                      </div>
                      <div>
                        <Label htmlFor="cardNumber">Card Number *</Label>
                        <Input
                          id="cardNumber"
                          placeholder="1234 5678 9012 3456"
                          value={paymentData.cardNumber}
                          onChange={(e) => setPaymentData(prev => ({ ...prev, cardNumber: e.target.value }))}
                          autoComplete="cc-number"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="expiryDate">Expiry Date *</Label>
                          <Input
                            id="expiryDate"
                            placeholder="MM/YY"
                            value={paymentData.expiryDate}
                            onChange={(e) => setPaymentData(prev => ({ ...prev, expiryDate: e.target.value }))}
                            autoComplete="cc-exp"
                          />
                        </div>
                        <div>
                          <Label htmlFor="cvv">CVV *</Label>
                          <Input
                            id="cvv"
                            placeholder="123"
                            value={paymentData.cvv}
                            onChange={(e) => setPaymentData(prev => ({ ...prev, cvv: e.target.value }))}
                            autoComplete="cc-csc"
                          />
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="nameOnCard">Name on Card *</Label>
                        <Input
                          id="nameOnCard"
                          value={paymentData.nameOnCard}
                          onChange={(e) => setPaymentData(prev => ({ ...prev, nameOnCard: e.target.value }))}
                          autoComplete="cc-name"
                        />
                      </div>
                    </div>
                  )}

                  {/* Pay at Office */}
                  {paymentData.method === 'office' && (
                    <div className="space-y-2">
                      <p className="text-sm text-gray-700">
                        You can pay for your product at our office. We will contact you to arrange pickup or delivery and payment.
                      </p>
                    </div>
                  )}

                  {/* Security Features */}
                  <div className="mt-2 p-4 bg-green-50 rounded-lg">
                    <div className="flex items-center gap-2 text-green-800 mb-2">
                      <Shield className="h-5 w-5" />
                      <span className="font-medium">Your payment is secure</span>
                    </div>
                    <p className="text-sm text-green-700">
                      We use industry-standard encryption to protect your payment information.
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Order Review */}
            {currentStep === 'review' && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Package className="h-5 w-5" />
                    Review Your Order
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Delivery Details */}
                  <div>
                    <h3 className="font-semibold mb-3">{isPickup ? 'Pickup Details' : 'Delivery Address'}</h3>
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <p className="font-medium">{shippingData.firstName} {shippingData.lastName}</p>
                      {isPickup ? (
                        <>
                          <p>Pickup: Office/Warehouse</p>
                          <p>{shippingData.country}</p>
                          <p>{shippingData.email}</p>
                          <p>Phone: {shippingData.phone}</p>
                        </>
                      ) : (
                        <>
                          <p>{shippingData.address}</p>
                          <p>{shippingData.place}</p>
                          <p>{selectedCity || '—'}, {shippingData.country}</p>
                          <p>{shippingData.email}</p>
                          <p>Phone: {shippingData.phone}</p>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Payment Method */}
                  <div>
                    <h3 className="font-semibold mb-3">Payment Method</h3>
                    <div className="p-4 bg-gray-50 rounded-lg space-y-1">
                      {paymentData.method === 'card' && (
                        <>
                          <p>Card ending in {paymentData.cardNumber.slice(-4)}</p>
                          <p>{paymentData.nameOnCard}</p>
                        </>
                      )}
                      {paymentData.method === 'mobile' && (
                        <>
                          <p>Mobile Money: {paymentData.provider}</p>
                          <p>Phone: {maskPhone(paymentData.mobilePhone)}</p>
                        </>
                      )}
                      {paymentData.method === 'office' && (
                        <>
                          <p>Pay at Office</p>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Order Items */}
                  <div>
                    <h3 className="font-semibold mb-3">Order Items ({totalItems})</h3>
                    <div className="space-y-4">
                      {displayItems.map((item) => (
                        <div key={item.id} className="flex items-center gap-4 p-4 border rounded-lg">
                          <div className="w-16 h-16 bg-gray-100 rounded-md flex-shrink-0"></div>
                          <div className="flex-1">
                            <h4 className="font-medium">{item.name}</h4>
                            <p className="text-sm text-gray-600">Quantity: {item.quantity}</p>
                          </div>
                          <div className="text-lg font-semibold">
                            {formatPrice(item.price * item.quantity)}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Navigation Buttons */}
            <div className="flex justify-between mt-8">
              <Button
                variant="outline"
                onClick={handlePreviousStep}
                disabled={currentStep === 'shipping'}
                className="px-6"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Previous
              </Button>

              {currentStep === 'review' ? (
                <Button
                  onClick={handlePlaceOrder}
                  disabled={isProcessing}
                  className="px-8"
                >
                  {isProcessing ? 'Processing...' : 'Place Order'}
                  {!isProcessing && <ArrowRight className="h-4 w-4 ml-2" />}
                </Button>
              ) : (
                <Button
                  onClick={handleNextStep}
                  disabled={!isStepValid(currentStep)}
                  className="px-6"
                >
                  Next
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              )}
            </div>
          </div>

          {/* Order Summary Sidebar */}
          <div className="lg:col-span-1">
            <Card className="sticky top-24">
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between text-sm">
                  <span>Subtotal ({totalItems} items)</span>
                  <span>{formatPrice(subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Delivery</span>
                  <span>{isPickup ? formatPrice(0) : (hasCity ? (isDar ? 'TSH 5000 to 10000' : formatPrice(15000)) : '—')}</span>
                </div>
                <Separator />
                <div className="flex justify-between text-lg font-semibold">
                  <span>Total</span>
                  <span>{formatPrice(total)}</span>
                </div>

                {/* Trust Badges */}
                <div className="mt-6 space-y-3">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Shield className="h-4 w-4 text-green-600" />
                    <span>SSL Encrypted Checkout</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Truck className="h-4 w-4 text-blue-600" />
                    <span>Safe, secure delivery. Items handled with care and sealed packaging.</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
