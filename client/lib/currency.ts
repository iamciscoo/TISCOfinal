import { Currency, ExchangeRates } from './types'

// Supported currencies with flags and basic info
export const CURRENCIES: Record<string, Currency> = {
  TZS: {
    code: 'TZS',
    symbol: 'TSh',
    name: 'Tanzanian Shilling',
    flag: '🇹🇿',
    exchange_rate: 1 // Base currency
  },
  USD: {
    code: 'USD',
    symbol: '$',
    name: 'US Dollar',
    flag: '🇺🇸',
    exchange_rate: 0.0004 // Approximate rate - should be fetched from API
  }
}

// Mock exchange rates - in production, this would come from a real API
const MOCK_EXCHANGE_RATES: ExchangeRates = {
  TZS: 1,
  USD: 0.0004,
  EUR: 0.00037,
  CNY: 0.00286,
  timestamp: Date.now()
}

// Storage key for selected currency
const CURRENCY_STORAGE_KEY = 'tisco_selected_currency'

export class CurrencyConverter {
  private static instance: CurrencyConverter
  private exchangeRates: ExchangeRates = MOCK_EXCHANGE_RATES
  private selectedCurrency: string = 'TZS'

  constructor() {
    if (typeof window !== 'undefined') {
      this.selectedCurrency = localStorage.getItem(CURRENCY_STORAGE_KEY) || 'TZS'
    }
  }

  static getInstance(): CurrencyConverter {
    if (!CurrencyConverter.instance) {
      CurrencyConverter.instance = new CurrencyConverter()
    }
    return CurrencyConverter.instance
  }

  // Convert from TZS (base currency) to target currency
  convert(amountInTZS: number, targetCurrency: string = this.selectedCurrency): number {
    const rate = this.exchangeRates[targetCurrency as keyof ExchangeRates]
    if (!rate) return amountInTZS
    return amountInTZS * rate
  }

  // Convert from any currency to TZS
  convertToTZS(amount: number, fromCurrency: string): number {
    const rate = this.exchangeRates[fromCurrency as keyof ExchangeRates]
    if (!rate) return amount
    return amount / rate
  }

  // Format currency with proper symbol and formatting
  format(amountInTZS: number, targetCurrency: string = this.selectedCurrency): string {
    const currency = CURRENCIES[targetCurrency]
    if (!currency) return `TSh ${amountInTZS.toLocaleString()}`

    const convertedAmount = this.convert(amountInTZS, targetCurrency)

    // Format based on currency
    if (targetCurrency === 'USD') {
      return `${currency.symbol}${convertedAmount.toFixed(2)}`
    } else {
      return `${currency.symbol} ${Math.round(convertedAmount).toLocaleString()}`
    }
  }

  // Get current selected currency
  getSelectedCurrency(): string {
    return this.selectedCurrency
  }

  // Set selected currency and persist to localStorage
  setSelectedCurrency(currency: string): void {
    if (CURRENCIES[currency]) {
      this.selectedCurrency = currency
      if (typeof window !== 'undefined') {
        localStorage.setItem(CURRENCY_STORAGE_KEY, currency)
      }
    }
  }

  // Get all available currencies
  getAvailableCurrencies(): Currency[] {
    return Object.values(CURRENCIES)
  }

  // Update exchange rates (would be called from API in production)
  updateExchangeRates(rates: Partial<ExchangeRates>): void {
    this.exchangeRates = { ...this.exchangeRates, ...rates, timestamp: Date.now() }
  }

  // Check if rates need updating (older than 1 hour)
  ratesNeedUpdate(): boolean {
    const oneHour = 60 * 60 * 1000
    return Date.now() - this.exchangeRates.timestamp > oneHour
  }
}

// Singleton instance
export const currencyConverter = CurrencyConverter.getInstance()

// React hook for currency conversion
export const useCurrency = () => {
  const converter = CurrencyConverter.getInstance()

  return {
    selectedCurrency: converter.getSelectedCurrency(),
    availableCurrencies: converter.getAvailableCurrencies(),
    convert: (amount: number, targetCurrency?: string) => converter.convert(amount, targetCurrency),
    format: (amount: number, targetCurrency?: string) => converter.format(amount, targetCurrency),
    setSelectedCurrency: (currency: string) => converter.setSelectedCurrency(currency),
    getCurrencyInfo: (code: string) => CURRENCIES[code]
  }
}
