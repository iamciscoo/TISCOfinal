/**
 * Error Boundary component for graceful error handling
 * 
 * Features:
 * - Catches JavaScript errors anywhere in the child component tree
 * - Logs error information for debugging
 * - Displays user-friendly error messages
 * - Provides recovery options (retry, refresh)
 * - Customizable fallback components
 * - Development mode error details
 */

'use client'

import React from 'react'
import { AlertTriangle, RefreshCw, Home } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface ErrorBoundaryState {
  hasError: boolean
  error?: Error
  errorId?: string
}

interface ErrorBoundaryProps {
  children: React.ReactNode
  fallback?: React.ComponentType<{ error?: Error; reset: () => void; errorId?: string }>
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void
  level?: 'page' | 'section' | 'component'
  className?: string
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    // Generate unique error ID for tracking
    const errorId = `error-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    return { hasError: true, error, errorId }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Enhanced error logging with context
    const errorContext = {
      errorId: this.state.errorId,
      level: this.props.level || 'component',
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      componentStack: errorInfo.componentStack,
    }
    
    console.group('🚨 Error Boundary Caught Error')
    console.error('Error:', error)
    console.error('Error Info:', errorInfo)
    console.error('Context:', errorContext)
    console.groupEnd()
    
    // Call custom error handler if provided
    this.props.onError?.(error, errorInfo)
    
    // TODO: Send to error tracking service (Sentry, LogRocket, etc.)
  }

  reset = () => {
    this.setState({ hasError: false, error: undefined, errorId: undefined })
  }

  render() {
    if (this.state.hasError) {
      const fallbackProps = {
        error: this.state.error,
        reset: this.reset,
        errorId: this.state.errorId,
        level: this.props.level
      }
      
      if (this.props.fallback) {
        const FallbackComponent = this.props.fallback
        return (
          <div className={this.props.className}>
            <FallbackComponent {...fallbackProps} />
          </div>
        )
      }

      return (
        <div className={this.props.className}>
          <DefaultErrorFallback {...fallbackProps} />
        </div>
      )
    }

    return this.props.children
  }
}

interface DefaultErrorFallbackProps {
  error?: Error
  reset: () => void
  errorId?: string
  level?: 'page' | 'section' | 'component'
}

const DefaultErrorFallback: React.FC<DefaultErrorFallbackProps> = ({ 
  error, 
  reset, 
  errorId, 
  level = 'component' 
}) => {
  const isPageLevel = level === 'page'
  const cardClasses = cn(
    isPageLevel ? 'max-w-lg mx-auto mt-16' : 'max-w-md mx-auto mt-8',
    'shadow-lg'
  )
  
  const getErrorMessage = () => {
    switch (level) {
      case 'page':
        return 'This page encountered an error and could not be displayed.'
      case 'section':
        return 'This section could not be loaded due to an error.'
      default:
        return 'We encountered an unexpected error in this component.'
    }
  }
  
  return (
    <Card className={cardClasses}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-red-600">
          <AlertTriangle className="h-5 w-5" />
          {isPageLevel ? 'Page Error' : 'Something went wrong'}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-gray-600">
          {getErrorMessage()}
        </p>
        
        {errorId && (
          <p className="text-xs text-gray-500 font-mono bg-gray-50 p-2 rounded">
            Error ID: {errorId}
          </p>
        )}
        
        {process.env.NODE_ENV === 'development' && error && (
          <details className="text-sm bg-red-50 border border-red-200 p-3 rounded">
            <summary className="cursor-pointer font-medium text-red-800">Development Error Details</summary>
            <div className="mt-2 space-y-2">
              <div>
                <strong>Message:</strong>
                <pre className="text-xs overflow-auto bg-white p-2 rounded mt-1">{error.message}</pre>
              </div>
              {error.stack && (
                <div>
                  <strong>Stack Trace:</strong>
                  <pre className="text-xs overflow-auto bg-white p-2 rounded mt-1 max-h-32">{error.stack}</pre>
                </div>
              )}
            </div>
          </details>
        )}
        
        <div className="flex flex-wrap gap-2">
          <Button onClick={reset} variant="outline" className="flex items-center gap-2">
            <RefreshCw className="h-4 w-4" />
            Try Again
          </Button>
          
          {isPageLevel ? (
            <>
              <Button onClick={() => window.location.reload()} variant="default">
                Refresh Page
              </Button>
              <Button onClick={() => window.location.href = '/'} variant="ghost" className="flex items-center gap-2">
                <Home className="h-4 w-4" />
                Go Home
              </Button>
            </>
          ) : (
            <Button onClick={() => window.location.reload()} variant="default">
              Refresh Page
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

export default ErrorBoundary
