'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ChevronDown } from 'lucide-react'

interface Currency {
  code: string
  symbol: string
  flag: string
  name: string
}

interface CurrencyState {
  primary: Currency
  secondary: Currency
  rate: number
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

export const CurrencyConverter = () => {
  const [currencyState, setCurrencyState] = useState<CurrencyState>({
    primary: currencies[0], // TZS as primary
    secondary: currencies[1], // USD as secondary
    rate: MOCK_EXCHANGE_RATE,
    lastUpdated: new Date().toLocaleTimeString()
  })

  const [isLoading, setIsLoading] = useState(false)

  // Simulate fetching exchange rate
  const updateExchangeRate = async () => {
    setIsLoading(true)
    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 500))
      
      // In real app, you would fetch from API like:
      // const response = await fetch('https://api.exchangerate-api.com/v4/latest/USD')
      // const data = await response.json()
      // const rate = data.rates.TZS
      
      // For now, add small random variation to simulate real rates
      const variation = (Math.random() - 0.5) * 100 // ±50 TZS variation
      const newRate = MOCK_EXCHANGE_RATE + variation
      
      setCurrencyState(prev => ({
        ...prev,
        rate: Math.round(newRate * 100) / 100, // Round to 2 decimal places
        lastUpdated: new Date().toLocaleTimeString()
      }))
    } catch (error) {
      console.error('Failed to fetch exchange rate:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // Update exchange rate every 5 minutes
  useEffect(() => {
    const interval = setInterval(updateExchangeRate, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [])

  const switchCurrencies = () => {
    setCurrencyState(prev => ({
      primary: prev.secondary,
      secondary: prev.primary,
      rate: prev.primary.code === 'TZS' ? 1 / prev.rate : prev.rate,
      lastUpdated: prev.lastUpdated
    }))
  }

  const formatCurrency = (amount: number, currency: Currency) => {
    if (currency.code === 'TZS') {
      return `${currency.symbol} ${amount.toLocaleString('en-US', { maximumFractionDigits: 0 })}`
    } else {
      return `${currency.symbol}${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    }
  }

  const getConvertedAmount = (amount: number) => {
    if (currencyState.primary.code === 'TZS') {
      return amount / currencyState.rate // TZS to USD
    } else {
      return amount * currencyState.rate // USD to TZS
    }
  }

  // Sample amount for display (equivalent to $1 or 2500 TZS)
  const sampleAmount = currencyState.primary.code === 'TZS' ? 2500 : 1
  const convertedAmount = getConvertedAmount(sampleAmount)

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="flex items-center gap-2 text-gray-700 hover:text-blue-600">
          <span className="text-lg">{currencyState.primary.flag}</span>
          <span className="font-medium">{currencyState.primary.code}</span>
          <ChevronDown className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent align="end" className="w-80 p-4">
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-gray-900">Currency Converter</h3>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={updateExchangeRate}
              disabled={isLoading}
              className="text-xs"
            >
              {isLoading ? 'Updating...' : 'Refresh'}
            </Button>
          </div>

          {/* Current Rate Display */}
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-lg">{currencyState.primary.flag}</span>
                <span className="font-medium">{formatCurrency(sampleAmount, currencyState.primary)}</span>
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={switchCurrencies}
                className="px-2 py-1 h-auto"
              >
                ⇄
              </Button>
              <div className="flex items-center gap-2">
                <span className="text-lg">{currencyState.secondary.flag}</span>
                <span className="font-medium">{formatCurrency(convertedAmount, currencyState.secondary)}</span>
              </div>
            </div>
            <p className="text-xs text-gray-500 text-center">
              Last updated: {currencyState.lastUpdated}
            </p>
          </div>

          {/* Currency Options */}
          <div className="space-y-2">
            <p className="text-sm text-gray-600">Switch primary currency:</p>
            {currencies.map((currency) => (
              <DropdownMenuItem
                key={currency.code}
                onClick={() => {
                  if (currency.code !== currencyState.primary.code) {
                    const otherCurrency = currencies.find(c => c.code !== currency.code)!
                    setCurrencyState(prev => ({
                      ...prev,
                      primary: currency,
                      secondary: otherCurrency,
                      rate: currency.code === 'TZS' ? MOCK_EXCHANGE_RATE : 1 / MOCK_EXCHANGE_RATE
                    }))
                  }
                }}
                className={`flex items-center gap-3 ${
                  currency.code === currencyState.primary.code ? 'bg-blue-50' : ''
                }`}
              >
                <span className="text-lg">{currency.flag}</span>
                <div className="flex-1">
                  <div className="font-medium">{currency.code}</div>
                  <div className="text-sm text-gray-500">{currency.name}</div>
                </div>
                {currency.code === currencyState.primary.code && (
                  <div className="w-2 h-2 bg-blue-600 rounded-full" />
                )}
              </DropdownMenuItem>
            ))}
          </div>

          {/* Rate Info */}
          <div className="text-xs text-gray-500 border-t pt-2">
            Exchange rates are indicative and may vary at checkout.
          </div>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

// Hook to use currency context throughout the app
export const useCurrency = () => {
  const [primaryCurrency, setPrimaryCurrency] = useState<Currency>(currencies[0])
  
  const formatPrice = (price: number) => {
    if (primaryCurrency.code === 'USD') {
      return `${primaryCurrency.symbol}${price.toFixed(2)}`
    } else {
      // Convert USD to TZS
      const convertedPrice = price * MOCK_EXCHANGE_RATE
      return `${primaryCurrency.symbol} ${Math.round(convertedPrice).toLocaleString()}`
    }
  }

  const convertPrice = (usdPrice: number): number => {
    return primaryCurrency.code === 'USD' ? usdPrice : usdPrice * MOCK_EXCHANGE_RATE
  }

  return {
    primaryCurrency,
    setPrimaryCurrency,
    formatPrice,
    convertPrice,
    currencies
  }
}