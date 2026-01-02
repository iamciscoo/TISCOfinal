'use client'

import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ChevronDown, RefreshCw } from 'lucide-react'
import { useCurrency } from '@/lib/currency-context'
import { CountryFlag } from '@/components/country-flag'

export const CurrencyToggle = () => {
  const {
    selectedCurrency,
    availableCurrencies,
    switchCurrency,
    exchangeRate,
    isLoading,
    lastUpdated
  } = useCurrency()



  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="flex items-center gap-2 text-gray-700 hover:text-blue-600 whitespace-nowrap">
          <CountryFlag code={selectedCurrency.code} className="w-5 h-4 rounded-sm" title={selectedCurrency.name} />
          <span className="font-medium" suppressHydrationWarning>{selectedCurrency.code}</span>
          <ChevronDown className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-[calc(100vw-2rem)] max-w-80 p-4 z-[70]">
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-gray-900">Currency</h3>
            <Button
              variant="ghost"
              size="sm"
              disabled={isLoading}
              className="text-xs"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                  Updating...
                </>
              ) : (
                `Rate: ${exchangeRate.toFixed(0)}`
              )}
            </Button>
          </div>

          {/* Current Rate Display */}
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="flex items-center justify-between mb-2">
              {selectedCurrency.code === 'TZS' ? (
                // When TZS is selected, show USD rate as reference
                <>
                  <div className="flex items-center gap-2">
                    <CountryFlag code="USD" className="w-5 h-4 rounded-sm" title="US Dollar" />
                    <span className="font-medium text-sm">1 USD</span>
                  </div>
                  <span className="text-gray-400 mx-2">=</span>
                  <div className="flex items-center gap-2">
                    <CountryFlag code="TZS" className="w-5 h-4 rounded-sm" title="Tanzania" />
                    <span className="font-medium text-sm">TSh 2,500</span>
                  </div>
                </>
              ) : (
                // For other currencies, show selected currency to TZS
                <>
                  <div className="flex items-center gap-2">
                    <CountryFlag code={selectedCurrency.code} className="w-5 h-4 rounded-sm" title={selectedCurrency.name} />
                    <span className="font-medium text-sm">1 {selectedCurrency.code}</span>
                  </div>
                  <span className="text-gray-400 mx-2">=</span>
                  <div className="flex items-center gap-2">
                    <CountryFlag code="TZS" className="w-5 h-4 rounded-sm" title="Tanzania" />
                    <span className="font-medium text-sm">TSh {exchangeRate.toLocaleString()}</span>
                  </div>
                </>
              )}
            </div>
            <p className="text-xs text-gray-500 text-center" suppressHydrationWarning>
              Last updated: {lastUpdated || '—'}
            </p>
          </div>

          {/* Currency Options */}
          <div className="space-y-2">
            <p className="text-sm text-gray-600">Select currency:</p>
            {availableCurrencies.map((currency) => (
              <DropdownMenuItem
                key={currency.code}
                onClick={() => switchCurrency(currency.code)}
                className={`flex items-center gap-3 cursor-pointer ${currency.code === selectedCurrency.code ? 'bg-blue-50' : ''
                  }`}
              >
                <CountryFlag code={currency.code} className="w-5 h-4 rounded-sm" title={currency.name} />
                <div className="flex-1">
                  <div className="font-medium">{currency.code}</div>
                  <div className="text-sm text-gray-500">{currency.name}</div>
                </div>
                {currency.code === selectedCurrency.code && (
                  <div className="w-2 h-2 bg-blue-600 rounded-full" />
                )}
              </DropdownMenuItem>
            ))}
          </div>

          {/* Rate Info */}
          <div className="text-xs text-gray-500 border-t pt-2">
            Prices update automatically. Exchange rates are indicative. TZS is base currency for purchase.
          </div>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
