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
import { useAuth } from '@/hooks/use-auth'
import { OrderProcessingLoader } from '@/components/OrderProcessingLoader'
import { AuthGuard } from '@/components/auth/AuthGuard'

type CheckoutStep = 'shipping' | 'payment' | 'review'

type PaymentMethod = 'mobile' | 'office'
type PaymentData = {
  method: PaymentMethod
  provider: string
  mobilePhone: string
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
  const { user } = useAuth()
  const { items, clearCart, getTotalPrice, getTotalItems } = useCartStore()
  const { toast } = useToast()
  const [currentStep, setCurrentStep] = useState<CheckoutStep>('shipping')
  const [isProcessing, setIsProcessing] = useState(false)
  const [paymentTimeout, setPaymentTimeout] = useState(false)
  const [canRetryPayment, setCanRetryPayment] = useState(false)

  // Avoid hydration mismatch by deferring persisted cart reads until after mount
  const [mounted, setMounted] = useState(false)
  const [validationTrigger, setValidationTrigger] = useState(0)
  useEffect(() => { setMounted(true) }, [])

  // Form data
  const [shippingData, setShippingData] = useState({
    firstName: user?.user_metadata?.first_name || '',
    lastName: user?.user_metadata?.last_name || '',
    email: user?.email || '',
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
    mobilePhone: ''
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

  // Let middleware handle authentication redirect
  // Removed client-side auth check to prevent redirect loops

  // Autofill detection - check for autofilled values periodically and on events
  useEffect(() => {
    const detectAutofill = () => {
      // Get all input elements in the checkout form
      const inputs = document.querySelectorAll('input[id^="firstName"], input[id^="lastName"], input[id^="email"], input[id^="phone"], input[id^="address"], input[id^="otherCity"], input[id^="place"], input[id^="mobilePhone"]')
      let hasAutofillValues = false
      
      inputs.forEach((input: Element) => {
        const htmlInput = input as HTMLInputElement
        if (htmlInput.matches(':-webkit-autofill') || htmlInput.value !== '') {
          hasAutofillValues = true
          
          // Sync autofilled values with React state
          const id = htmlInput.id
          const value = htmlInput.value
          
          if (id === 'firstName' && value !== shippingData.firstName) {
            setShippingData(prev => ({ ...prev, firstName: value }))
          } else if (id === 'lastName' && value !== shippingData.lastName) {
            setShippingData(prev => ({ ...prev, lastName: value }))
          } else if (id === 'email' && value !== shippingData.email) {
            setShippingData(prev => ({ ...prev, email: value }))
          } else if (id === 'phone' && value !== shippingData.phone) {
            setShippingData(prev => ({ ...prev, phone: formatTzPhoneInput(value) }))
          } else if (id === 'address' && value !== shippingData.address) {
            setShippingData(prev => ({ ...prev, address: value }))
          } else if (id === 'otherCity' && value !== shippingData.otherCity) {
            setShippingData(prev => ({ ...prev, otherCity: value }))
          } else if (id === 'place' && value !== shippingData.place) {
            setShippingData(prev => ({ ...prev, place: value }))
          } else if (id === 'mobilePhone' && value !== paymentData.mobilePhone) {
            setPaymentData(prev => ({ ...prev, mobilePhone: formatTzPhoneInput(value) }))
          }
        }
      })
      
      if (hasAutofillValues) {
        setValidationTrigger(prev => prev + 1)
      }
    }

    // Check immediately
    detectAutofill()
    
    // Set up periodic checks for autofill
    const interval = setInterval(detectAutofill, 500)
    
    // Listen for autofill events
    const handleAutofill = () => {
      setTimeout(detectAutofill, 100)
    }
    
    // Add event listeners for various autofill triggers
    const events = ['change', 'input', 'focus', 'blur', 'animationstart']
    events.forEach(eventType => {
      document.addEventListener(eventType, handleAutofill)
    })
    
    return () => {
      clearInterval(interval)
      events.forEach(eventType => {
        document.removeEventListener(eventType, handleAutofill)
      })
    }
  }, [shippingData.firstName, shippingData.lastName, shippingData.email, shippingData.phone, shippingData.address, shippingData.otherCity, shippingData.place, paymentData.mobilePhone])

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

  // Strict TZ mobile phone format enforcement for payment: +255 7XX XXX XXX (also allow +255 6XX ...)
  const TZ_PHONE_PATTERN = /^\+255 [67]\d{2} \d{3} \d{3}$/

  // Allow free typing during input, only format on blur/submission
  const allowFreePhoneInput = (raw: string) => {
    // Just clean basic formatting but allow natural typing
    return raw.replace(/[^\d\+\-\s\(\)]/g, '').slice(0, 20)
  }

  const formatTzPhoneInput = (raw: string) => {
    // Allow users to input in any format, but normalize and format for display
    const digits = (raw || '').replace(/\D/g, '')
    if (!digits) return ''
    
    let msisdn = digits
    
    // Normalize various input formats to 255XXXXXXXXX
    if (msisdn.startsWith('0') && msisdn.length >= 10) {
      // 0754123456 -> 255754123456
      msisdn = '255' + msisdn.slice(1)
    } else if (msisdn.length === 9 && (msisdn[0] === '6' || msisdn[0] === '7')) {
      // 754123456 -> 255754123456
      msisdn = '255' + msisdn
    } else if (msisdn.startsWith('2550') && msisdn.length >= 13) {
      // 2550754123456 -> 255754123456 (common mistake)
      msisdn = '255' + msisdn.slice(4)
    } else if (msisdn.startsWith('255')) {
      // Already in international format
      msisdn = msisdn
    } else if (msisdn.length <= 9 && (msisdn[0] === '6' || msisdn[0] === '7' || msisdn[0] === '0')) {
      // Handle partial typing of local numbers
      if (msisdn[0] === '0') {
        msisdn = '255' + msisdn.slice(1)
      } else {
        msisdn = '255' + msisdn
      }
    } else {
      // For any other format, prepend 255 and let validation handle it
      msisdn = '255' + msisdn
    }
    
    // Limit to 12 digits total (255 + 9 local digits)
    msisdn = msisdn.slice(0, 12)
    
    // Only format if we have meaningful digits beyond 255
    if (msisdn.length <= 3) return digits // Return raw input for partial typing
    
    const localPart = msisdn.slice(3)
    let formatted = '+255'
    
    if (localPart.length > 0) formatted += ' ' + localPart.slice(0, 3)
    if (localPart.length > 3) formatted += ' ' + localPart.slice(3, 6)
    if (localPart.length > 6) formatted += ' ' + localPart.slice(6, 9)
    
    return formatted
  }

  const isValidTzPhone = (value: string) => TZ_PHONE_PATTERN.test(value)

  // Check if phone input is definitely invalid (not just incomplete)
  const isDefinitelyInvalidPhone = (value: string) => {
    if (!value || value.length <= 3) return false // Too short to determine
    
    const digits = value.replace(/\D/g, '')
    if (!digits) return false
    
    // If too long (more than 12 digits), definitely invalid
    if (digits.length > 12) return true
    
    // If has decent length but wrong prefixes, definitely invalid
    if (digits.length >= 6) {
      // Check various normalized formats
      let normalized = digits
      if (digits.startsWith('0') && digits.length >= 10) {
        normalized = '255' + digits.slice(1)
      } else if (digits.length === 9 && (digits[0] === '6' || digits[0] === '7')) {
        normalized = '255' + digits
      } else if (digits.startsWith('2550')) {
        normalized = '255' + digits.slice(4)
      } else if (!digits.startsWith('255') && digits.length >= 9) {
        normalized = '255' + digits
      }
      
      // If normalized and has enough digits, check if valid TZ format
      if (normalized.length >= 10) {
        // Must start with 255 and 4th digit must be 6 or 7
        if (!normalized.startsWith('255') || (normalized[3] !== '6' && normalized[3] !== '7')) {
          return true
        }
      }
    }
    
    return false
  }

  // Check if phone is short after normalization (doesn't have exactly 9 digits after 255)
  const isPhoneShortAfterNormalization = (value: string) => {
    if (!value) return false
    
    const digits = value.replace(/\D/g, '')
    if (!digits) return false
    
    // Normalize the phone number using the same logic as formatTzPhoneInput
    let normalized = digits
    if (digits.startsWith('0') && digits.length >= 10) {
      normalized = '255' + digits.slice(1)
    } else if (digits.length === 9 && (digits[0] === '6' || digits[0] === '7')) {
      normalized = '255' + digits
    } else if (digits.startsWith('2550') && digits.length >= 13) {
      normalized = '255' + digits.slice(4)
    } else if (digits.startsWith('255')) {
      normalized = digits
    } else if (digits.length <= 9 && (digits[0] === '6' || digits[0] === '7' || digits[0] === '0')) {
      if (digits[0] === '0') {
        normalized = '255' + digits.slice(1)
      } else {
        normalized = '255' + digits
      }
    } else {
      normalized = '255' + digits
    }
    
    // After normalization, should have exactly 12 digits (255 + 9 local digits)
    // If less than 12, it's short
    return normalized.length < 12
  }

  // Normalize formatted TZ mobile to digits-only E.164 without plus sign (e.g., 2557XXXXXXXXX)
  // Assumes UI already enforces +255 6/7XX XXX XXX, so stripping non-digits is sufficient.
  const normalizeTzPhoneForApi = (value: string) => {
    const digits = (value || '').replace(/\D/g, '')
    return digits
  }

  const handleNextStep = () => {
    if (currentStep === 'shipping') {
      setCurrentStep('payment')
    } else if (currentStep === 'payment') {
      setCurrentStep('review')
    }
    // Scroll to top smoothly when moving to next step
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleNextStepWithValidation = () => {
    // For shipping step, use existing validation
    if (currentStep === 'shipping') {
      if (!isStepValid('shipping')) {
        toast({
          title: "Almost There! 📋",
          description: "Please complete all delivery fields to continue with your order.",
          variant: "default",
        })
        return
      }
      handleNextStep()
    } 
    // For payment step, show specific validation feedback
    else if (currentStep === 'payment') {
      if (paymentData.method === 'mobile') {
        if (!paymentData.provider) {
          toast({
            title: "Just One More Step! 📱",
            description: "Please select your mobile service provider to continue.",
            variant: "default",
          })
          return
        }
        if (!paymentData.mobilePhone) {
          toast({
            title: "Phone Number Needed 📞",
            description: "Please enter your mobile phone number to receive the payment prompt.",
            variant: "default",
          })
          return
        }
        if (!isValidTzPhone(paymentData.mobilePhone)) {
          toast({
            title: "Phone Number Format 📱",
            description: "Please enter a valid Tanzanian mobile number (e.g., +255 7XX XXX XXX).",
            variant: "default",
          })
          return
        }
      }
      handleNextStep()
    }
    // For review step, proceed directly
    else {
      handleNextStep()
    }
  }

  const handlePreviousStep = () => {
    if (currentStep === 'payment') {
      setCurrentStep('shipping')
    } else if (currentStep === 'review') {
      setCurrentStep('payment')
    }
    // Scroll to top smoothly when moving to previous step
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handlePlaceOrder = async () => {
    if (!user) {
      toast({
        title: "Sign In Required 🔐",
        description: "Please sign in to complete and track your order.",
        variant: "default",
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
        title: "Complete Your Details 📋",
        description: "Please fill in all required delivery information to place your order.",
        variant: "default",
      })
      return
    }

    // Validate payment by method
    if (paymentData.method === 'mobile') {
      if (!paymentData.provider || !paymentData.mobilePhone) {
        toast({
          title: "Payment Details Needed 📱", 
          description: "Please select your mobile service and enter your phone number.",
          variant: "default",
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
      if (paymentData.method === 'mobile') {
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

      // Handle different payment methods - create order only after successful payment for mobile money
      if (paymentData.method === 'office') {
        // Non-mobile flows (card, office payment) - create order first
        const orderResponse = await fetch('/api/orders', {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(orderData),
        })

        const orderResult = await orderResponse.json()
        if (!orderResponse.ok) {
          // Order creation failed - show error and suggest payment method change
          toast({
            title: "Oops! Something Went Wrong",
            description: orderResult.error || 'We couldn\'t create your order. Please try a different payment method.',
            variant: "destructive",
          })
          // Don't disable retry, let user try again or change payment method
          setCurrentStep('payment')
          return
        }

        // Office payment successful - send notifications
        try {
          // Send notifications via API route
          const notificationResponse = await fetch('/api/notifications', {
            method: 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              type: 'order_created',
              data: {
                order_id: orderResult.order.id,
                customer_email: shippingData.email,
                customer_name: `${shippingData.firstName} ${shippingData.lastName}`,
                total_amount: subtotal.toString(),
                currency: 'TZS',
                items: items.map(item => ({
                  name: item.name,
                  quantity: item.quantity,
                  price: item.price.toString()
                })),
                order_date: new Date().toLocaleDateString(),
                payment_method: 'Pay at Office',
                shipping_address: isPickup ? 'Pickup at Office' : `${shippingData.address}, ${shippingData.place}, ${selectedCity}`,
                payment_status: 'pending'
              }
            })
          })

          if (!notificationResponse.ok) {
            console.warn('Failed to send notifications:', await notificationResponse.text())
          }
        } catch (emailError) {
          console.warn('Failed to send notifications:', emailError)
        }

        toast({ title: 'Order Placed!', description: `Order #${orderResult.order.id.slice(0, 8)} created. You will be contacted for delivery arrangements.` })
        clearCart()
        router.push('/account/orders')
      } else {
        // Mobile money payment flow - initiate payment first, create order only after success
        try {
          const msisdn = normalizeTzPhoneForApi(paymentData.mobilePhone)
          if (!(msisdn.length === 12 && msisdn.startsWith('255') && (msisdn[3] === '6' || msisdn[3] === '7'))) {
            throw new Error('Invalid phone format. Use 2557XXXXXXXX (TZ)')
          }
          
          // First create a temporary payment session without order
          const procRes = await fetch('/api/payments/mobile/initiate', {
            method: 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              amount: subtotal,
              currency: 'TZS',
              provider: paymentData.provider,
              phone_number: msisdn,
              order_data: orderData, // Pass order data for creation after payment success
            }),
          })
          const procJson = await procRes.json()
          if (!procRes.ok) {
            // Handle ZenoPay result codes for retryable errors
            const isRetryable = procJson?.retryable !== false
            const resultCode = procJson?.result_code
            const errorMessage = procJson?.error || 'Failed to initiate mobile payment.'
            
            console.log(`❌ Payment initiation failed - Code: ${resultCode}, Retryable: ${isRetryable}`)
            
            toast({
              title: "Payment Initiation Failed",
              description: isRetryable 
                ? `${errorMessage} Please try again.`
                : `${errorMessage} Please contact support or try a different payment method.`,
              variant: "destructive",
            })
            
            // Enable retry and timeout UI for retryable errors
            if (isRetryable) {
              setPaymentTimeout(true)
              setCanRetryPayment(true)
            }
            
            setCurrentStep('payment')
            return
          }

          toast({
            title: 'Payment Initiated',
            description: 'Please approve the payment on your phone to complete the order.',
          })

          // Poll our status endpoint with enhanced timeout and retry mechanism
          const reference: string | undefined = procJson?.transaction_reference
          if (!reference) {
            console.error('No payment reference returned from initiation')
            toast({
              title: 'Payment Setup Failed',
              description: 'Unable to setup payment. Please try again or use a different payment method.',
              variant: 'destructive'
            })
            setPaymentTimeout(true)
            setCanRetryPayment(true)
            return
          }
            
          const success = await pollPaymentStatus(reference)
          if (!success) {
            // Payment timed out or failed - enable retry
            console.log('Payment polling failed, enabling retry')
            setPaymentTimeout(true)
            setCanRetryPayment(true)
            toast({
              title: 'Payment Timeout',
              description: 'Payment is taking longer than expected. You can retry or the order will be processed if payment completes.',
              variant: 'default'
            })
            return
          }
            
          // Payment successful - rely on server webhook to create the order and clear server cart.
          // Clear local cart to avoid client/server cart divergence and re-syncs.
          toast({ title: 'Payment Confirmed', description: 'We are finalizing your order. It will appear in your Orders shortly.' })
          clearCart()
          // Cart is now client-side only, no server cleanup needed
          try { sessionStorage.setItem('orders:refresh', '1') } catch {}
          router.push('/account/orders?justPaid=1')
          return
        } catch (err) {
          console.error('Payment processing error:', err)
          toast({ 
            title: 'Payment Error', 
            description: (err as Error).message + ' Please try again or change your payment method.', 
            variant: 'destructive' 
          })
          // Return to payment step to allow method change or retry
          setCurrentStep('payment')
          return
        }
      }

    } catch (error: unknown) {
      console.error('Error placing order:', error)
      toast({
        title: "Order Not Completed",
        description: (error as Error).message || "We encountered an issue placing your order. Please try again or choose a different payment method.",
        variant: "destructive",
      })
      // Return to payment step to allow method change or retry
      setCurrentStep('payment')
    } finally {
      setIsProcessing(false)
    }
  }

  // Enhanced payment status polling with exponential backoff and better error handling
  // Helper function to get user-friendly payment failure reasons
  const getPaymentFailureReason = (status: string): string => {
    const reasonMap: Record<string, string> = {
      'failed': 'Payment failed. Please check your balance and try again.',
      'declined': 'Payment was declined by your mobile money provider.',
      'cancelled': 'You canceled the payment on your phone. Feel free to try again.',
      'timeout': 'Payment request timed out. Please ensure you respond promptly on your phone.',
      'expired': 'Payment session expired. Please start a new payment.',
      'error': 'Payment error occurred. Please try a different payment method.',
      'rejected': 'Payment was rejected. Please check your account and try again.',
      'insufficient_funds': 'Insufficient balance in your mobile money account.',
      'invalid_pin': 'Invalid PIN entered. Please try again.',
      'user_canceled': 'You canceled the payment. Feel free to try again.'
    }
    
    return reasonMap[status] || 'Payment failed. Please try again or use a different payment method.'
  }

  const pollPaymentStatus = async (reference: string): Promise<boolean> => {
    const start = Date.now()
    const timeoutMs = 50_000 // 50 seconds for mobile money
    let attempt = 0
    const maxAttempts = 12 // Reduced from 20 (with longer delays)
    
    const delay = (ms: number) => new Promise(r => setTimeout(r, ms))
    // Optimized: Start at 2s, increase more aggressively, cap at 5s
    // Attempt 0: 2s, 1: 3s, 2: 4s, 3+: 5s
    const getDelay = (attempt: number) => Math.min(2000 + (attempt * 1000), 5000)
    
    while (Date.now() - start < timeoutMs && attempt < maxAttempts) {
      try {
        const sres = await fetch('/api/payments/mobile/status', {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ reference })
        })
        
        if (!sres.ok) {
          console.warn(`Payment status check failed: ${sres.status} ${sres.statusText}`)
          throw new Error(`Status check failed: ${sres.status}`)
        }
        
        const sjson = await sres.json()
        const st = String(sjson?.status || '').toLowerCase()
        const message = sjson?.message || ''
        
        console.log(`Payment status check ${attempt + 1}: ${st}`, { message, order_id: sjson?.order_id })

        // ZenoPay specific status handling (enhanced with webhook statuses)
        const successSet = new Set(['success', 'settled', 'completed', 'approved', 'successful'])
        const failureSet = new Set([
          'failed', 'declined', 'cancelled', 'error', 'timeout', 'expired',
          'rejected' // Added from webhook handling
        ])
        const processingSet = new Set(['pending', 'processing', 'initiated', 'submitted'])

        if (successSet.has(st)) {
          console.log('✅ Payment confirmed as successful')
          toast({ 
            title: 'Payment Confirmed! 🎉', 
            description: sjson?.order_id ? 
              `Order ${sjson.order_id.slice(0, 8)}... created successfully` :
              'Payment completed and order is being processed',
          })
          return true // Payment successful
        }
        
        if (failureSet.has(st)) {
          const reason = sjson?.failure_reason || message || getPaymentFailureReason(st)
          console.log('❌ Payment failed:', { status: st, reason })
          
          // Enable retry for failed payments
          setPaymentTimeout(true)
          setCanRetryPayment(true)
          
          toast({ 
            title: 'Payment Failed ❌', 
            description: reason + ' You can retry the payment.',
            variant: 'destructive' 
          })
          return false // Payment failed
        }

        // Still processing - show encouraging message every 3rd attempt (reduced from 5th)
        // With longer delays, this means roughly every 10-15 seconds
        if (processingSet.has(st) && attempt > 0 && attempt % 3 === 0) {
          toast({ 
            title: 'Payment Processing... 📱', 
            description: message || 'Please check your phone for payment confirmation',
            variant: 'default'
          })
        }

        // Show status update for any unhandled status
        if (!successSet.has(st) && !failureSet.has(st) && !processingSet.has(st)) {
          console.log('⚠️ Unknown payment status:', st)
          toast({ 
            title: 'Payment Status Update', 
            description: message || `Status: ${st}. Please wait for confirmation.`,
            variant: 'default'
          })
        }
        // Continue polling for PENDING/PROCESSING status
      } catch (error) {
        console.warn(`Payment status check attempt ${attempt + 1} failed:`, error)
        // Continue trying unless it's the last attempt
        if (attempt >= maxAttempts - 1) {
          console.error('Max payment status check attempts reached')
          return false
        }
      }
      
      attempt++
      const delayMs = getDelay(attempt)
      console.log(`Waiting ${delayMs}ms before next status check...`)
      await delay(delayMs)
    }
    
    console.log('Payment status polling timed out')
    
    // Enable retry for timeouts
    setPaymentTimeout(true)
    setCanRetryPayment(true)
    
    toast({ 
      title: 'Payment Timeout ⏰', 
      description: 'The payment confirmation timed out. This could happen if you responded too late or entered an incorrect PIN.',
      variant: 'destructive' 
    })
    
    return false // Timeout reached
  }

  // Retry payment without existing order (since we don't create orders until payment succeeds)
  const handleRetryPayment = async () => {
    if (paymentData.method !== 'mobile') return
    
    try {
      setIsProcessing(true)
      setPaymentTimeout(false)
      setCanRetryPayment(false)
      
      const msisdn = normalizeTzPhoneForApi(paymentData.mobilePhone)
      if (!(msisdn.length === 12 && msisdn.startsWith('255') && (msisdn[3] === '6' || msisdn[3] === '7'))) {
        throw new Error('Invalid phone format. Use 2557XXXXXXXX (TZ)')
      }
      
      // Prepare order data for retry
      let shipping_address = ''
      if (shippingData.deliveryMethod === 'pickup') {
        shipping_address = `${shippingData.firstName} ${shippingData.lastName}\nPhone: ${shippingData.phone}\nPickup: Office/Warehouse\n${shippingData.country}`
      } else {
        shipping_address = `${shippingData.firstName} ${shippingData.lastName}\n${shippingData.address}\n${shippingData.place}\n${selectedCity || 'Tanzania'}\n${shippingData.country}\nPhone: ${shippingData.phone}`
      }
      
      let payment_method = ''
      let payment_summary = ''
      payment_method = `Mobile Money (${paymentData.provider}) - ${maskPhone(paymentData.mobilePhone)}`
      payment_summary = `Mobile Money (${paymentData.provider}) to ${paymentData.mobilePhone}`

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
        contact_phone: shippingData.phone,
        address_line_1: shippingData.address,
        city: selectedCity,
        email: shippingData.email,
        place: shippingData.place,
        first_name: shippingData.firstName,
        last_name: shippingData.lastName,
        country: shippingData.country,
      }
      
      // Retry payment initiation
      const procRes = await fetch('/api/payments/mobile/initiate', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: subtotal,
          currency: 'TZS',
          provider: paymentData.provider,
          phone_number: msisdn,
          order_data: orderData,
        }),
      })
      
      const procJson = await procRes.json()
      if (!procRes.ok) {
        // Check if error is retryable based on ZenoPay result code
        const isRetryable = procJson?.retryable !== false
        const resultCode = procJson?.result_code
        const errorMessage = procJson?.error || 'Failed to retry mobile payment.'
        
        console.log(`❌ Retry failed - Code: ${resultCode}, Retryable: ${isRetryable}`)
        
        toast({
          title: "Payment Retry Failed",
          description: isRetryable 
            ? `${errorMessage} You can try again.`
            : `${errorMessage} Please contact support if this continues.`,
          variant: "destructive",
        })
        
        // Keep retry enabled only if error is retryable
        setCanRetryPayment(isRetryable)
        setCurrentStep('payment')
        return
      }

      toast({
        title: 'Payment Retry Initiated',
        description: 'Please check your phone and approve the payment request.',
      })

      // Poll for payment status again
      const reference: string | undefined = procJson?.transaction_reference
      if (reference) {
        const success = await pollPaymentStatus(reference)
        if (!success) {
          // Payment timed out again - allow another retry
          setPaymentTimeout(true)
          setCanRetryPayment(true)
          // Payment timeout again - no toast notification, just show retry UI
          return
        }
        
        // Payment successful - rely on server webhook to create the order and clear server cart.
        // Clear local cart to prevent stale local items from re-syncing.
        toast({ title: 'Payment Confirmed', description: 'We are finalizing your order. It will appear in your Orders shortly.' })
        clearCart()
        // Cart is now client-side only, no server cleanup needed
        try { sessionStorage.setItem('orders:refresh', '1') } catch {}
        router.push('/account/orders?justPaid=1')
      }
      
    } catch (error: unknown) {
      console.error('Error retrying payment:', error)
      toast({
        title: "Payment Retry Issue",
        description: (error as Error).message || "We couldn't retry your payment. Please try again or choose another payment method.",
        variant: "destructive",
      })
      // Keep retry enabled and return to payment step
      setCanRetryPayment(true)
      setCurrentStep('payment')
    } finally {
      setIsProcessing(false)
    }
  }

  const isStepValid = (step: CheckoutStep) => {
    // Force re-evaluation when autofill is detected by including validationTrigger in dependency
    // eslint-disable-next-line @typescript-eslint/no-unused-expressions
    validationTrigger;
    
    switch (step) {
      case 'shipping':
        return (
          !!shippingData.firstName &&
          !!shippingData.lastName &&
          !!shippingData.email &&
          !!shippingData.phone &&
          isValidTzPhone(shippingData.phone) &&
          (shippingData.deliveryMethod === 'pickup' || (
            !!shippingData.city &&
            (shippingData.city !== 'Other' || !!shippingData.otherCity) &&
            !!shippingData.place
          ))
        )
      case 'payment':
        if (paymentData.method === 'mobile') {
          return !!(paymentData.provider && isValidTzPhone(paymentData.mobilePhone))
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
    <AuthGuard>
      <div className="min-h-screen bg-gray-50">
        <Navbar />
      
      
      <div className="max-w-6xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8">
        {/* Breadcrumb */}
        <nav className="flex items-center space-x-2 text-sm text-gray-600 mb-6 sm:mb-8 overflow-x-auto">
          <Link href="/" className="hover:text-blue-600 whitespace-nowrap">Home</Link>
          <span>/</span>
          <Link href="/cart" className="hover:text-blue-600 whitespace-nowrap">Cart</Link>
          <span>/</span>
          <span className="text-gray-900 whitespace-nowrap">Checkout</span>
        </nav>

        {/* Page Header */}
        <div className="text-center mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Secure Checkout</h1>
          <p className="text-sm sm:text-base text-gray-600">Complete your order in a few simple steps</p>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-center mb-8 sm:mb-12 overflow-x-auto">
          <div className="flex items-center space-x-4 sm:space-x-8 min-w-max px-4">
            {steps.map((step, index) => {
              const StepIcon = step.icon
              const isActive = currentStep === step.id
              const isCompleted = steps.findIndex(s => s.id === currentStep) > index
              
              return (
                <div key={step.id} className="flex items-center">
                  <div className="flex flex-col items-center">
                    <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center border-2 ${
                      isCompleted 
                        ? 'bg-green-500 border-green-500 text-white' 
                        : isActive 
                        ? 'bg-blue-500 border-blue-500 text-white'
                        : 'bg-white border-gray-300 text-gray-500'
                    }`}>
                      {isCompleted ? (
                        <Check className="h-4 w-4 sm:h-6 sm:w-6" />
                      ) : (
                        <StepIcon className="h-4 w-4 sm:h-6 sm:w-6" />
                      )}
                    </div>
                    <span className={`mt-1 sm:mt-2 text-xs sm:text-sm font-medium whitespace-nowrap ${
                      isActive ? 'text-blue-600' : isCompleted ? 'text-green-600' : 'text-gray-500'
                    }`}>
                      {step.title}
                    </span>
                  </div>
                  {index < steps.length - 1 && (
                    <div className={`w-8 sm:w-16 h-0.5 mx-2 sm:mx-4 ${
                      isCompleted ? 'bg-green-500' : 'bg-gray-300'
                    }`} />
                  )}
                </div>
              )
            })}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
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
                <CardContent className="space-y-4 sm:space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                        inputMode="numeric"
                        placeholder="07xx xxx xxx"
                        value={shippingData.phone}
                        onChange={(e) => setShippingData(prev => ({ ...prev, phone: allowFreePhoneInput(e.target.value) }))}
                        onBlur={(e) => setShippingData(prev => ({ ...prev, phone: formatTzPhoneInput(e.target.value) }))}
                        autoComplete="tel"
                        pattern={'^\\+255 [67]\\d{2} \\d{3} \\d{3}$'}
                        maxLength={20}
                        title="Enter your TZ mobile number in any format - we'll format it automatically"
                        aria-invalid={isDefinitelyInvalidPhone(shippingData.phone) || isPhoneShortAfterNormalization(shippingData.phone)}
                        className={(isDefinitelyInvalidPhone(shippingData.phone) || isPhoneShortAfterNormalization(shippingData.phone)) ? "border-red-500 focus:border-red-500 focus:ring-red-500" : ""}
                        required
                      />
                      <p className="mt-1 text-xs text-gray-500">Should be reachable for delivery coordination (may differ from payment number)</p>
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
                    <div className="flex flex-col sm:flex-row gap-2 mb-3">
                      <Button
                        type="button"
                        variant={shippingData.deliveryMethod === 'delivery' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setShippingData(prev => ({ ...prev, deliveryMethod: 'delivery' }))}
                        className="w-full sm:w-auto"
                      >
                        Home/Office Delivery
                      </Button>
                      <Button
                        type="button"
                        variant={shippingData.deliveryMethod === 'pickup' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setShippingData(prev => ({ ...prev, deliveryMethod: 'pickup' }))}
                        className="w-full sm:w-auto"
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
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <Button
                      type="button"
                      variant={paymentData.method === 'mobile' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setPaymentData(prev => ({ ...prev, method: 'mobile' }))}
                      className="w-full"
                    >
                      Mobile Money
                    </Button>
                    <Button
                      type="button"
                      variant={paymentData.method === 'office' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setPaymentData(prev => ({ ...prev, method: 'office' }))}
                      className="w-full"
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
                          className="w-full h-24 sm:h-32 object-contain bg-white"
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
                          inputMode="numeric"
                          placeholder="7xx xxx xxx"
                          value={paymentData.mobilePhone}
                          onChange={(e) => setPaymentData(prev => ({ ...prev, mobilePhone: allowFreePhoneInput(e.target.value) }))}
                          onBlur={(e) => setPaymentData(prev => ({ ...prev, mobilePhone: formatTzPhoneInput(e.target.value) }))}
                          autoComplete="tel"
                          pattern={'^\\+255 [67]\\d{2} \\d{3} \\d{3}$'}
                          maxLength={20}
                          title="Enter your TZ mobile number in any format - we'll format it automatically"
                          aria-invalid={isDefinitelyInvalidPhone(paymentData.mobilePhone) || isPhoneShortAfterNormalization(paymentData.mobilePhone)}
                          className={(isDefinitelyInvalidPhone(paymentData.mobilePhone) || isPhoneShortAfterNormalization(paymentData.mobilePhone)) ? "border-red-500 focus:border-red-500 focus:ring-red-500" : ""}
                        />
                      </div>
                      <div className="space-y-2">
                        <p className="text-sm text-gray-600">
                          <strong>Payment Process:</strong> After placing your order, you&apos;ll receive a payment prompt on your phone within 15 seconds. <strong>Double check if the phone number is correct!!</strong>
                        </p>
                        <p className="text-xs text-gray-500">
                          • You have 15 seconds to approve the payment on your phone<br/>
                          • If you miss the prompt or enter an incorrect PIN, you can retry the payment<br/>
                          • Make sure your phone is nearby and ready to receive the payment request
                        </p>
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

                  {/* Payment Timeout/Retry Section */}
                  {paymentTimeout && canRetryPayment && paymentData.method === 'mobile' && (
                    <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <div className="flex items-center gap-2 text-yellow-800 mb-2">
                        <Shield className="h-5 w-5" />
                        <span className="font-medium">Payment Timeout</span>
                      </div>
                      <p className="text-sm text-yellow-700 mb-3">
                        The payment confirmation timed out. This could happen if you responded too late or entered an incorrect PIN.
                      </p>
                      <div className="flex flex-col sm:flex-row gap-2">
                        <Button
                          onClick={handleRetryPayment}
                          disabled={isProcessing}
                          size="sm"
                          className="w-full sm:w-auto"
                        >
                          {isProcessing ? 'Retrying...' : 'Retry Payment'}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setPaymentTimeout(false)
                            setCanRetryPayment(false)
                            setCurrentStep('payment')
                          }}
                          className="w-full sm:w-auto"
                        >
                          Change Payment Method
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Order Items */}
                  <div>
                    <h3 className="font-semibold mb-3">Order Items ({totalItems})</h3>
                    <div className="space-y-4">
                      {displayItems.map((item) => (
                        <div key={item.id} className="flex items-center gap-4 p-4 border rounded-lg">
                          <div className="w-16 h-16 bg-gray-100 rounded-md flex-shrink-0 overflow-hidden">
                            {item.image_url ? (
                              <Image
                                src={item.image_url}
                                alt={item.name}
                                width={64}
                                height={64}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  // Fallback to gray background if image fails to load
                                  const target = e.target as HTMLImageElement;
                                  target.style.display = 'none';
                                }}
                              />
                            ) : (
                              <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                                <Package className="h-6 w-6 text-gray-400" />
                              </div>
                            )}
                          </div>
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
            <div className="flex flex-col sm:flex-row justify-between gap-3 sm:gap-0 mt-6 sm:mt-8">
              <Button
                variant="outline"
                onClick={handlePreviousStep}
                disabled={currentStep === 'shipping'}
                className="px-6 w-full sm:w-auto order-2 sm:order-1"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Previous
              </Button>

              {currentStep === 'review' ? (
                <Button
                  onClick={handlePlaceOrder}
                  disabled={isProcessing || (paymentTimeout && !canRetryPayment)}
                  className={`px-8 w-full sm:w-auto order-1 sm:order-2 bg-black hover:bg-black text-white border-black transition-none ${
                    isProcessing || (paymentTimeout && !canRetryPayment)
                      ? 'opacity-50 cursor-not-allowed'
                      : 'hover:opacity-90 active:scale-[0.98] sm:hover:scale-[1.02]'
                  } touch-manipulation`}
                >
                  {isProcessing ? 'Processing...' : (paymentTimeout ? 'Payment Pending...' : 'Place Order')}
                  {!isProcessing && !paymentTimeout && <ArrowRight className="h-4 w-4 ml-2" />}
                </Button>
              ) : (
                <Button
                  onClick={handleNextStepWithValidation}
                  className={`px-6 w-full sm:w-auto order-1 sm:order-2 bg-black hover:bg-black text-white border-black transition-none hover:opacity-90 active:scale-[0.98] sm:hover:scale-[1.02] touch-manipulation`}
                >
                  Next
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              )}
            </div>
          </div>

          {/* Order Summary Sidebar */}
          <div className="lg:col-span-1">
            {/* Order Processing Loader Card */}
            {isProcessing && (
              <div className="mb-6">
                <OrderProcessingLoader 
                  isVisible={isProcessing}
                  message={paymentData.method === 'mobile' ? "Processing Payment & Order" : "Creating Your Order"}
                  submessage="Please check your account and emails for status updates."
                />
              </div>
            )}
            
            {/* Sticky container for proper scrolling behavior */}
            <div className="lg:sticky lg:top-24 space-y-6">
              <Card className="lg:max-h-[calc(100vh-12rem)] lg:overflow-y-auto">
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
                    <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-600">
                      <Shield className="h-4 w-4 text-green-600 flex-shrink-0" />
                      <span>SSL Encrypted Checkout</span>
                    </div>
                    <div className="flex items-start gap-2 text-xs sm:text-sm text-gray-600">
                      <Truck className="h-4 w-4 text-blue-600 flex-shrink-0 mt-0.5" />
                      <span>Safe, secure delivery. Items handled with care and sealed packaging.</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              {/* Delivery Image Card - Only show when not processing */}
              {!isProcessing && (
                <Card className="relative overflow-hidden p-0 border-0 shadow-none bg-transparent h-48 lg:h-56">
                  <Image
                    src="/images/deliverypic.png"
                    alt="Fast, reliable delivery across Tanzania"
                    fill
                    sizes="(min-width: 1024px) 320px, 100vw"
                    className="object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/30 to-transparent" aria-hidden="true" />
                  <div className="absolute bottom-3 left-3 right-3 text-white drop-shadow">
                    <p className="text-sm sm:text-base font-semibold">Quick delivery. Best Service.</p>
                    <p className="text-xs text-gray-200/90">We deliver your product safely and on time.</p>
                  </div>
                </Card>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
    </AuthGuard>
  )
}
