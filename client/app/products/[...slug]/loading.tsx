'use client'

export default function LoadingProduct() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Breadcrumb skeleton */}
      <div className="h-4 bg-gray-200 rounded w-48 mb-8 animate-pulse" />

      <div className="grid md:grid-cols-2 gap-8">
        {/* Image gallery skeleton */}
        <div className="space-y-4">
          <div className="aspect-square bg-gradient-to-br from-gray-200 to-gray-300 rounded-2xl animate-pulse relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" 
                 style={{ animationDuration: '2s' }} />
          </div>
          <div className="grid grid-cols-4 gap-2">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="aspect-square bg-gray-200 rounded-lg animate-pulse" />
            ))}
          </div>
        </div>

        {/* Product details skeleton */}
        <div className="space-y-6">
          {/* Title */}
          <div className="space-y-2">
            <div className="h-8 bg-gray-200 rounded w-3/4 animate-pulse" />
            <div className="h-4 bg-gray-200 rounded w-1/2 animate-pulse" />
          </div>

          {/* Rating */}
          <div className="flex items-center gap-2">
            <div className="h-5 bg-gray-200 rounded w-24 animate-pulse" />
            <div className="h-4 bg-gray-200 rounded w-20 animate-pulse" />
          </div>

          {/* Price */}
          <div className="h-10 bg-gradient-to-r from-blue-100 to-indigo-100 rounded-lg w-32 animate-pulse" />

          {/* Description */}
          <div className="space-y-2">
            <div className="h-4 bg-gray-200 rounded w-full animate-pulse" />
            <div className="h-4 bg-gray-200 rounded w-5/6 animate-pulse" />
            <div className="h-4 bg-gray-200 rounded w-4/6 animate-pulse" />
          </div>

          {/* Quantity and buttons */}
          <div className="space-y-4 pt-4">
            <div className="h-12 bg-gray-200 rounded-lg w-32 animate-pulse" />
            <div className="flex gap-3">
              <div className="h-12 bg-blue-200 rounded-lg flex-1 animate-pulse" />
              <div className="h-12 bg-gray-200 rounded-lg w-12 animate-pulse" />
            </div>
          </div>

          {/* Loading indicator */}
          <div className="flex items-center gap-3 text-gray-600 pt-4">
            <svg className="animate-spin h-5 w-5 text-blue-600" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
            </svg>
            <span className="text-sm">Loading product details…</span>
          </div>
        </div>
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
