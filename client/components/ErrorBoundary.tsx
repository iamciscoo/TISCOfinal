'use client'

import React from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface ErrorBoundaryState {
  hasError: boolean
  error?: Error
}

interface ErrorBoundaryProps {
  children: React.ReactNode
  fallback?: React.ComponentType<{ error?: Error; reset: () => void }>
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo)
    this.props.onError?.(error, errorInfo)
  }

  reset = () => {
    this.setState({ hasError: false, error: undefined })
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        const FallbackComponent = this.props.fallback
        return <FallbackComponent error={this.state.error} reset={this.reset} />
      }

      return <DefaultErrorFallback error={this.state.error} reset={this.reset} />
    }

    return this.props.children
  }
}

const DefaultErrorFallback: React.FC<{ error?: Error; reset: () => void }> = ({ error, reset }) => (
  <Card className="max-w-md mx-auto mt-8">
    <CardHeader>
      <CardTitle className="flex items-center gap-2 text-red-600">
        <AlertTriangle className="h-5 w-5" />
        Something went wrong
      </CardTitle>
    </CardHeader>
    <CardContent className="space-y-4">
      <p className="text-gray-600">
        We encountered an unexpected error. Please try refreshing the page or contact support if the problem persists.
      </p>
      {process.env.NODE_ENV === 'development' && error && (
        <details className="text-sm bg-gray-50 p-3 rounded">
          <summary className="cursor-pointer font-medium">Error Details</summary>
          <pre className="mt-2 text-xs overflow-auto">{error.message}</pre>
        </details>
      )}
      <div className="flex gap-2">
        <Button onClick={reset} variant="outline" className="flex items-center gap-2">
          <RefreshCw className="h-4 w-4" />
          Try Again
        </Button>
        <Button onClick={() => window.location.reload()} variant="default">
          Refresh Page
        </Button>
      </div>
    </CardContent>
  </Card>
)

export default ErrorBoundary
