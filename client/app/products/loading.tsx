'use client'

export default function LoadingProducts() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header skeleton */}
      <div className="mb-8 space-y-4">
        <div className="h-10 bg-gray-200 rounded w-64 animate-pulse" />
        <div className="h-4 bg-gray-200 rounded w-48 animate-pulse" />
      </div>

      {/* Filters skeleton */}
      <div className="mb-6 flex gap-4">
        <div className="h-10 bg-gray-200 rounded w-32 animate-pulse" />
        <div className="h-10 bg-gray-200 rounded w-32 animate-pulse" />
        <div className="h-10 bg-gray-200 rounded w-40 animate-pulse" />
      </div>

      {/* Product grid skeleton */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
        {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
          <div key={i} className="group">
            <div className="aspect-square bg-gradient-to-br from-gray-200 to-gray-300 rounded-xl animate-pulse relative overflow-hidden mb-3">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" 
                   style={{ animationDuration: '2s' }} />
            </div>
            <div className="space-y-2">
              <div className="h-4 bg-gray-200 rounded w-3/4 animate-pulse" />
              <div className="h-6 bg-blue-100 rounded w-1/2 animate-pulse" />
              <div className="flex gap-1">
                <div className="h-4 bg-gray-200 rounded w-16 animate-pulse" />
                <div className="h-4 bg-gray-200 rounded w-12 animate-pulse" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Loading indicator */}
      <div className="flex items-center justify-center gap-3 text-gray-600 mt-12">
        <svg className="animate-spin h-5 w-5 text-blue-600" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
        </svg>
        <span className="text-sm">Loading products…</span>
      </div>

      <style jsx>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        .animate-shimmer {
          animation: shimmer 2s infinite;
        }
      `}</style>
    </div>
  )
}
