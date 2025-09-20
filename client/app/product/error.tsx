'use client'

import Link from 'next/link'

export default function ProductError({ error: _error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  // Mark error as used for linting without exposing details
  void _error
  return (
    <div className="min-h-[50vh] flex items-center justify-center px-4">
      <div className="max-w-md text-center">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Something went wrong</h2>
        <p className="text-gray-600 mb-4">We couldn&apos;t load this product right now. Please try again.</p>
        <div className="flex items-center justify-center gap-3">
          <button onClick={() => reset()} className="px-4 py-2 bg-blue-600 text-white rounded-md">Try again</button>
          <Link href="/products" className="px-4 py-2 border rounded-md">Back to Products</Link>
        </div>
      </div>
    </div>
  )
}
