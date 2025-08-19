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
  }
]

// Mock exchange rate - in real app, this would come from an API
const MOCK_EXCHANGE_RATE = 2500 // 1 USD = 2500 TZS (approximate)

const CurrencyContext = createContext<CurrencyContextType | null>(null)

export const CurrencyProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [selectedCurrency, setSelectedCurrency] = useState<Currency>(currencies[0]) // Default to TZS
  const [exchangeRate, setExchangeRate] = useState(MOCK_EXCHANGE_RATE)
  const [isLoading, setIsLoading] = useState(false)
  const [lastUpdated, setLastUpdated] = useState(new Date().toLocaleTimeString())

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
    if (selectedCurrency.code === 'USD') {
      return price / exchangeRate // Convert TZS to USD
    }
    return price // Already in TZS
  }

  const updateExchangeRate = async () => {
    setIsLoading(true)
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500))
      
      // In real app, fetch from exchange rate API
      const variation = (Math.random() - 0.5) * 100 // ±50 TZS variation
      const newRate = MOCK_EXCHANGE_RATE + variation
      
      setExchangeRate(Math.round(newRate * 100) / 100)
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
