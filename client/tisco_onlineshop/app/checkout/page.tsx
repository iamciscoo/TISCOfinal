'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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

export default function CheckoutPage() {
  const router = useRouter()
  const { user } = useUser()
  const { items, clearCart, getTotalPrice, getTotalItems } = useCartStore()
  const { toast } = useToast()
  const [currentStep, setCurrentStep] = useState<CheckoutStep>('shipping')
  const [isProcessing, setIsProcessing] = useState(false)

  // Form data
  const [shippingData, setShippingData] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.emailAddresses[0]?.emailAddress || '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'United States'
  })

  const [paymentData, setPaymentData] = useState({
    cardNumber: '',
    expiryDate: '',
    cvv: '',
    nameOnCard: '',
    billingAddressSame: true
  })

  const totalItems = getTotalItems()
  const subtotal = getTotalPrice()
  const shippingCost = subtotal > 50 ? 0 : 9.99
  const taxAmount = subtotal * 0.08
  const total = subtotal + shippingCost + taxAmount

  // Redirect if cart is empty
  useEffect(() => {
    if (items.length === 0) {
      router.push('/cart')
    }
  }, [items.length, router])

  // Redirect if not authenticated
  useEffect(() => {
    if (!user) {
      router.push('/sign-in?redirect_url=/checkout')
    }
  }, [user, router])

  const steps = [
    { id: 'shipping', title: 'Shipping', icon: MapPin },
    { id: 'payment', title: 'Payment', icon: CreditCard },
    { id: 'review', title: 'Review', icon: Package }
  ]

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
    if (!shippingData.firstName || !shippingData.lastName || !shippingData.address || !shippingData.city) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required shipping information.",
        variant: "destructive",
      })
      return
    }

    if (!paymentData.cardNumber || !paymentData.expiryDate || !paymentData.cvv || !paymentData.nameOnCard) {
      toast({
        title: "Missing Information", 
        description: "Please fill in all required payment information.",
        variant: "destructive",
      })
      return
    }

    try {
      setIsProcessing(true)
      
      // Prepare order data
      const shipping_address = `${shippingData.firstName} ${shippingData.lastName}\n${shippingData.address}\n${shippingData.city}, ${shippingData.state} ${shippingData.zipCode}\n${shippingData.country}`
      
      const orderData = {
        items: items.map(item => ({
          product_id: item.productId,
          quantity: item.quantity,
          price: item.price
        })),
        shipping_address,
        payment_method: `**** **** **** ${paymentData.cardNumber.slice(-4)}`,
        currency: 'USD',
        notes: `Payment: ${paymentData.nameOnCard}`
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
        return shippingData.firstName && shippingData.lastName && 
               shippingData.email && shippingData.address && 
               shippingData.city && shippingData.state && shippingData.zipCode
      case 'payment':
        return paymentData.cardNumber && paymentData.expiryDate && 
               paymentData.cvv && paymentData.nameOnCard
      default:
        return true
    }
  }

  if (items.length === 0) {
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
                    Shipping Information
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
                      <Label htmlFor="phone">Phone Number</Label>
                      <Input
                        id="phone"
                        type="tel"
                        value={shippingData.phone}
                        onChange={(e) => setShippingData(prev => ({ ...prev, phone: e.target.value }))}
                        autoComplete="tel"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="address">Address *</Label>
                    <Input
                      id="address"
                      value={shippingData.address}
                      onChange={(e) => setShippingData(prev => ({ ...prev, address: e.target.value }))}
                      autoComplete="street-address"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="col-span-2 md:col-span-1">
                      <Label htmlFor="city">City *</Label>
                      <Input
                        id="city"
                        value={shippingData.city}
                        onChange={(e) => setShippingData(prev => ({ ...prev, city: e.target.value }))}
                        autoComplete="address-level2"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="state">State *</Label>
                      <Input
                        id="state"
                        value={shippingData.state}
                        onChange={(e) => setShippingData(prev => ({ ...prev, state: e.target.value }))}
                        autoComplete="address-level1"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="zipCode">ZIP Code *</Label>
                      <Input
                        id="zipCode"
                        value={shippingData.zipCode}
                        onChange={(e) => setShippingData(prev => ({ ...prev, zipCode: e.target.value }))}
                        autoComplete="postal-code"
                        required
                      />
                    </div>
                  </div>

                  {/* Shipping Options */}
                  <div className="mt-8">
                    <h3 className="text-lg font-semibold mb-4">Shipping Method</h3>
                    <div className="space-y-3">
                      <label className="flex items-center p-4 border border-blue-200 bg-blue-50 rounded-lg cursor-pointer">
                        <input type="radio" name="shipping" defaultChecked className="mr-3" />
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="font-medium">Standard Shipping</div>
                              <div className="text-sm text-gray-600">5-7 business days</div>
                            </div>
                            <div className="text-lg font-semibold">
                              {shippingCost === 0 ? 'FREE' : `$${shippingCost.toFixed(2)}`}
                            </div>
                          </div>
                        </div>
                      </label>
                      <label className="flex items-center p-4 border border-gray-200 rounded-lg cursor-pointer">
                        <input type="radio" name="shipping" className="mr-3" />
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="font-medium">Express Shipping</div>
                              <div className="text-sm text-gray-600">2-3 business days</div>
                            </div>
                            <div className="text-lg font-semibold">$14.99</div>
                          </div>
                        </div>
                      </label>
                    </div>
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
                  <div>
                    <Label htmlFor="cardNumber">Card Number *</Label>
                    <Input
                      id="cardNumber"
                      placeholder="1234 5678 9012 3456"
                      value={paymentData.cardNumber}
                      onChange={(e) => setPaymentData(prev => ({ ...prev, cardNumber: e.target.value }))}
                      autoComplete="cc-number"
                      required
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
                        required
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
                        required
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
                      required
                    />
                  </div>

                  {/* Security Features */}
                  <div className="mt-8 p-4 bg-green-50 rounded-lg">
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
                  {/* Shipping Details */}
                  <div>
                    <h3 className="font-semibold mb-3">Shipping Address</h3>
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <p className="font-medium">{shippingData.firstName} {shippingData.lastName}</p>
                      <p>{shippingData.address}</p>
                      <p>{shippingData.city}, {shippingData.state} {shippingData.zipCode}</p>
                      <p>{shippingData.email}</p>
                    </div>
                  </div>

                  {/* Payment Method */}
                  <div>
                    <h3 className="font-semibold mb-3">Payment Method</h3>
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <p>Card ending in {paymentData.cardNumber.slice(-4)}</p>
                      <p>{paymentData.nameOnCard}</p>
                    </div>
                  </div>

                  {/* Order Items */}
                  <div>
                    <h3 className="font-semibold mb-3">Order Items ({totalItems})</h3>
                    <div className="space-y-4">
                      {items.map((item) => (
                        <div key={item.id} className="flex items-center gap-4 p-4 border rounded-lg">
                          <div className="w-16 h-16 bg-gray-100 rounded-md flex-shrink-0"></div>
                          <div className="flex-1">
                            <h4 className="font-medium">{item.name}</h4>
                            <p className="text-sm text-gray-600">Quantity: {item.quantity}</p>
                          </div>
                          <div className="text-lg font-semibold">
                            ${(item.price * item.quantity).toFixed(2)}
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
                  <span>${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Shipping</span>
                  <span>{shippingCost === 0 ? 'FREE' : `$${shippingCost.toFixed(2)}`}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Tax</span>
                  <span>${taxAmount.toFixed(2)}</span>
                </div>
                <Separator />
                <div className="flex justify-between text-lg font-semibold">
                  <span>Total</span>
                  <span>${total.toFixed(2)}</span>
                </div>

                {/* Trust Badges */}
                <div className="mt-6 space-y-3">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Shield className="h-4 w-4 text-green-600" />
                    <span>SSL Encrypted Checkout</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Truck className="h-4 w-4 text-blue-600" />
                    <span>Free returns within 30 days</span>
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
