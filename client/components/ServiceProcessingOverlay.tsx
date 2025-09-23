'use client'

import { useEffect, useState } from 'react'
import { CheckCircle, XCircle, X } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface ServiceProcessingOverlayProps {
  isVisible: boolean
  status: 'processing' | 'success' | 'error' | 'idle'
  onClose: () => void
  errorMessage?: string
}

export const ServiceProcessingOverlay: React.FC<ServiceProcessingOverlayProps> = ({ 
  isVisible, 
  status,
  onClose,
  errorMessage
}) => {
  const [quantumLoaded, setQuantumLoaded] = useState(false)

  useEffect(() => {
    let mounted = true
    
    if (typeof window !== 'undefined' && isVisible && status === 'processing') {
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
  }, [isVisible, status])

  // Auto-close success state after 1.8 seconds
  useEffect(() => {
    if (status === 'success') {
      const timer = setTimeout(() => {
        onClose()
      }, 1800)
      return () => clearTimeout(timer)
    }
  }, [status, onClose])

  // Handle ESC key for accessibility
  useEffect(() => {
    if (!isVisible) return
    
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && status !== 'processing') {
        onClose()
      }
    }
    
    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [isVisible, status, onClose])

  // Focus trapping and body scroll lock
  useEffect(() => {
    if (isVisible) {
      document.body.style.overflow = 'hidden'
      return () => {
        document.body.style.overflow = 'unset'
      }
    }
  }, [isVisible])

  if (!isVisible) return null

  const getContent = () => {
    switch (status) {
      case 'processing':
        return {
          icon: quantumLoaded ? (
            <div 
              dangerouslySetInnerHTML={{
                __html: '<l-quantum size="50" speed="1.75" color="#0066CC"></l-quantum>'
              }}
            />
          ) : (
            <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          ),
          title: 'Processing Your Request',
          message: 'Setting up your service booking and sending notifications...',
          showClose: false,
          bgColor: 'bg-blue-50',
          borderColor: 'border-blue-200'
        }
      
      case 'success':
        return {
          icon: <CheckCircle className="w-12 h-12 text-green-600" />,
          title: 'Request Submitted Successfully!',
          message: 'Your service booking has been created. You will receive a confirmation email shortly.',
          showClose: true,
          bgColor: 'bg-green-50',
          borderColor: 'border-green-200'
        }
      
      case 'error':
        return {
          icon: <XCircle className="w-12 h-12 text-red-600" />,
          title: 'Request Failed',
          message: errorMessage || 'Something went wrong while processing your request. Please try again.',
          showClose: true,
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200'
        }
      
      default:
        return null
    }
  }

  const content = getContent()
  if (!content) return null

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="processing-title"
      aria-describedby="processing-description"
    >
      <div 
        className={`relative max-w-md w-full mx-4 ${content.bgColor} ${content.borderColor} border rounded-xl p-8 shadow-2xl animate-in fade-in-0 zoom-in-95 duration-200`}
      >
        {/* Close button - only show when not processing */}
        {content.showClose && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1 rounded-full hover:bg-black/10 transition-colors"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        )}

        <div className="text-center">
          {/* Icon */}
          <div className="flex justify-center mb-4">
            {content.icon}
          </div>
          
          {/* Title */}
          <h3 
            id="processing-title"
            className="text-xl font-semibold text-gray-900 mb-3"
          >
            {content.title}
          </h3>
          
          {/* Message */}
          <p 
            id="processing-description"
            className="text-gray-700 mb-4 leading-relaxed"
          >
            {content.message}
          </p>
          
          {/* Action button for error state */}
          {status === 'error' && (
            <Button 
              onClick={onClose}
              className="bg-gray-900 hover:bg-gray-800"
            >
              Try Again
            </Button>
          )}
          
          {/* Processing indicator */}
          {status === 'processing' && (
            <div className="text-sm text-gray-600">
              This may take a moment...
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
