import type { Appearance } from '@clerk/types'

// Shared Clerk appearance to match TISCO design
// Tailwind palette references: primary blue-600 (#2563eb), gray neutrals
export const clerkAppearance: Appearance = {
  variables: {
    colorPrimary: '#2563eb', // Tailwind blue-600
    colorText: '#111827', // gray-900
    colorTextSecondary: '#4b5563', // gray-600
    borderRadius: '0.5rem', // rounded-md
    fontFamily: 'var(--font-geist-sans)'
  },
  elements: {
    rootBox: 'w-full !mt-0',
    card: 'shadow-lg border border-gray-200 rounded-xl p-6 sm:p-8 bg-white !mt-0',
    header: 'hidden',
    headerTitle: 'hidden',
    headerSubtitle: 'hidden',

    form: 'space-y-4',
    formField: '',
    formFieldLabel: 'text-sm font-medium text-gray-700',
    formFieldInput:
      'w-full rounded-md border-gray-300 focus:border-blue-600 focus:ring-blue-600 placeholder:text-gray-400',
    formButtonPrimary:
      'w-full inline-flex justify-center items-center rounded-md bg-blue-600 hover:bg-blue-700 text-white font-medium h-10 transition-colors',

    footer: 'mt-4 text-left text-sm',
    footerActionLink: 'text-blue-600 hover:text-blue-700 hover:underline font-medium',

    socialButtonsBlockButton:
      'border-gray-300 hover:bg-gray-50 text-gray-700',
    socialButtonsIconButton:
      'border-gray-300 hover:bg-gray-50 text-gray-700',
    socialButtonsProviderIcon__apple: 'text-gray-900',

    identityPreviewEditButton:
      'text-blue-600 hover:text-blue-700 hover:underline',

    // Misc separators / dividers
    dividerLine: 'bg-gray-200',
    dividerText: 'text-gray-500',
  }
}
