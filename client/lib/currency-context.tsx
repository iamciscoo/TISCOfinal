'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'

interface Currency {
  code: string
  symbol: string
  flag: string
  name: string
}

interface CurrencyContextType {
  selectedCurrency: Currency
  availableCurrencies: Currency[]
  exchangeRate: number
  switchCurrency: (currencyCode: string) => void
  formatPrice: (price: number) => string
  convertPrice: (price: number) => number
  isLoading: boolean
  lastUpdated: string
}

const currencies: Currency[] = [
  {
    code: 'TZS',
    symbol: 'TSh',
    flag: '🇹🇿',
    name: 'Tanzanian Shilling'
  },
  {
    code: 'USD',
    symbol: '$',
    flag: '🇺🇸',
    name: 'US Dollar'
  },
  {
    code: 'EUR',
    symbol: '€',
    flag: '🇪🇺',
    name: 'Euro'
  },
  {
    code: 'CNY',
    symbol: '¥',
    flag: '🇨🇳',
    name: 'Chinese Yuan'
  }
]

// Mock exchange rates - in real app, this would come from an API
// Rates are TZS per 1 Unit of currency
const MOCK_RATES: Record<string, number> = {
  TZS: 1,
  USD: 2500,
  EUR: 2700,
  CNY: 350
}

const CurrencyContext = createContext<CurrencyContextType | null>(null)

export const CurrencyProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [selectedCurrency, setSelectedCurrency] = useState<Currency>(currencies[0]) // Default to TZS
  const [exchangeRate, setExchangeRate] = useState(MOCK_RATES.TZS)
  const [isLoading, setIsLoading] = useState(false)
  const [lastUpdated, setLastUpdated] = useState<string>("")

  // Load saved currency from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('tisco_selected_currency')
      if (saved) {
        const currency = currencies.find(c => c.code === saved)
        if (currency) {
          setSelectedCurrency(currency)
        }
      }
    }
  }, [])

  // Initialize lastUpdated after mount to avoid SSR/client time mismatch
  useEffect(() => {
    setLastUpdated(new Date().toLocaleTimeString())
  }, [])

  // Save currency to localStorage when it changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('tisco_selected_currency', selectedCurrency.code)
      // Dispatch custom event for components to listen to
      window.dispatchEvent(new CustomEvent('currencyChanged', {
        detail: { currency: selectedCurrency }
      }))
    }
  }, [selectedCurrency])

  const switchCurrency = (currencyCode: string) => {
    const currency = currencies.find(c => c.code === currencyCode)
    if (currency) {
      setSelectedCurrency(currency)
      // Update exchange rate based on selection
      // Note: In a real app we might fetch fresh rates here
      setExchangeRate(MOCK_RATES[currencyCode] || 1)
    }
  }

  const formatPrice = (price: number): string => {
    const convertedPrice = convertPrice(price)

    if (selectedCurrency.code === 'TZS') {
      return `${selectedCurrency.symbol} ${Math.round(convertedPrice).toLocaleString()}`
    } else {
      return `${selectedCurrency.symbol}${convertedPrice.toFixed(2)}`
    }
  }

  const convertPrice = (price: number): number => {
    // Prices are stored in TZS in the database
    // rate is TZS per unit. So to go TZS -> Unit, we divide by rate.
    // e.g. 2500 TZS / (2500 TZS/USD) = 1 USD
    if (selectedCurrency.code === 'TZS') return price
    return price / exchangeRate
  }

  const updateExchangeRate = async () => {
    setIsLoading(true)
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500))

      // In real app, fetch from exchange rate API
      // For now, just add some small random variation to the current mock rate
      const baseRate = MOCK_RATES[selectedCurrency.code] || 1
      if (selectedCurrency.code !== 'TZS') {
        const variation = (Math.random() - 0.5) * (baseRate * 0.02) // ±1% variation
        const newRate = baseRate + variation
        setExchangeRate(Math.round(newRate * 100) / 100)
      } else {
        setExchangeRate(1)
      }

      setLastUpdated(new Date().toLocaleTimeString())
    } catch (error) {
      console.error('Failed to fetch exchange rate:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // Auto-update exchange rate every 5 minutes
  useEffect(() => {
    const interval = setInterval(updateExchangeRate, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [])

  const value: CurrencyContextType = {
    selectedCurrency,
    availableCurrencies: currencies,
    exchangeRate,
    switchCurrency,
    formatPrice,
    convertPrice,
    isLoading,
    lastUpdated
  }

  return (
    <CurrencyContext.Provider value={value}>
      {children}
    </CurrencyContext.Provider>
  )
}

export const useCurrency = (): CurrencyContextType => {
  const context = useContext(CurrencyContext)
  if (!context) {
    throw new Error('useCurrency must be used within a CurrencyProvider')
  }
  return context
}
