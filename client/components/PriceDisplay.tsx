'use client'

import { useState, useEffect } from 'react'
import { useCurrency } from '@/lib/currency-context'

interface PriceDisplayProps {
  price: number
  className?: string
  showCurrency?: boolean
}

export const PriceDisplay: React.FC<PriceDisplayProps> = ({ 
  price, 
  className = "" 
}) => {
  const { formatPrice } = useCurrency()
  const [mounted, setMounted] = useState(false)

  // Prevent hydration mismatch
  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    // Show default TZS price during hydration
    return (
      <span className={className}>
        TSh {price.toLocaleString()}
      </span>
    )
  }

  const formattedPrice = formatPrice(price)

  return (
    <span className={className} title={`${price.toLocaleString()} TZS`}>
      {formattedPrice}
    </span>
  )
}
