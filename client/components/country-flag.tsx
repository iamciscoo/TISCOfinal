'use client'

/**
 * Country Flag Component
 * 
 * A reusable component that renders SVG country flags using the 
 * country-flag-icons package. Supports TZ (Tanzania) and US (United States).
 */

import { TZ, US, EU, CN } from 'country-flag-icons/react/3x2'

// Define the country codes we support
export type SupportedCountryCode = 'TZ' | 'US' | 'EU' | 'CN'

// Map currency codes to country codes
const currencyToCountry: Record<string, SupportedCountryCode> = {
    TZS: 'TZ',
    USD: 'US',
    EUR: 'EU',
    CNY: 'CN',
}

interface CountryFlagProps {
    /** ISO 3166-1 alpha-2 country code (TZ, US) or currency code (TZS, USD) */
    code: string
    /** Accessible title for the flag */
    title?: string
    /** CSS class names */
    className?: string
}

/**
 * Renders an SVG flag icon for the given country or currency code.
 * Falls back to a placeholder if the code is not supported.
 */
export function CountryFlag({ code, title, className = '' }: CountryFlagProps) {
    // Map currency codes to country codes
    const countryCode = currencyToCountry[code.toUpperCase()] || code.toUpperCase()

    switch (countryCode) {
        case 'TZ':
            return <TZ className={`inline-block ${className}`} title={title || 'Tanzania'} />
        case 'US':
            return <US className={`inline-block ${className}`} title={title || 'United States'} />
        case 'EU':
            return <EU className={`inline-block ${className}`} title={title || 'Europe'} />
        case 'CN':
            return <CN className={`inline-block ${className}`} title={title || 'China'} />
        default:
            // Fallback for unsupported codes - render a gray placeholder
            return (
                <span
                    className={`inline-block bg-gray-200 rounded ${className}`}
                    style={{ width: '1.5em', height: '1em' }}
                    title={title || code}
                />
            )
    }
}

/**
 * Helper hook to get the flag component for a given code.
 * Useful when you need to conditionally render flags.
 */
export function useFlagComponent(code: string) {
    const countryCode = currencyToCountry[code.toUpperCase()] || code.toUpperCase()

    switch (countryCode) {
        case 'TZ':
            return TZ
        case 'US':
            return US
        case 'EU':
            return EU
        case 'CN':
            return CN
        default:
            return null
    }
}
