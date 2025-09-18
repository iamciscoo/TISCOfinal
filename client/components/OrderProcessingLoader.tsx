'use client'

import { useEffect, useState } from 'react'

interface OrderProcessingLoaderProps {
  isVisible: boolean
  message?: string
  submessage?: string
}

export const OrderProcessingLoader: React.FC<OrderProcessingLoaderProps> = ({ 
  isVisible, 
  message = "Processing Your Order", 
  submessage = "Please check your account and emails for status updates"
}) => {
  const [quantumLoaded, setQuantumLoaded] = useState(false)

  useEffect(() => {
    let mounted = true
    
    if (typeof window !== 'undefined' && isVisible) {
      import('ldrs/quantum').then(() => {
        if (mounted) {
          setQuantumLoaded(true)
        }
      }).catch((error) => {
        console.warn('Quantum loader failed to load, using fallback:', error)
        if (mounted) {
          setQuantumLoaded(false)
        }
      })
    }

    return () => {
      mounted = false
    }
  }, [isVisible])

  if (!isVisible) return null

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-lg">
      <div className="text-center">
        <div className="flex justify-center mb-4">
          {quantumLoaded ? (
            <div 
              dangerouslySetInnerHTML={{
                __html: '<l-quantum size="45" speed="1.75" color="#0066CC"></l-quantum>'
              }}
            />
          ) : (
            <div className="w-11 h-11 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          )}
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">{message}</h3>
        <p className="text-sm text-gray-600 mb-3">{submessage}</p>
        <div className="text-xs text-gray-500">
          This may take a moment...
        </div>
      </div>
    </div>
  )
}
