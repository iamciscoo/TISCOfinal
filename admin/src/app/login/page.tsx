'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Lock, Shield } from 'lucide-react'

export default function LoginPage() {
  const [accessKey, setAccessKey] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent, accessKey: string) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')
    setSuccess('')

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accessKey })
      })
      if (!res.ok) {
        const ct = res.headers.get('content-type') || ''
        if (ct.includes('application/json')) {
          const data = await res.json().catch(() => ({}))
          const errorData = data as { error?: string; message?: string }
          setError(errorData?.error || errorData?.message || 'Incorrect access key. Please check your credentials and try again.')
        } else {
          const text = await res.text().catch(() => '')
          setError(text || 'Incorrect access key. Please check your credentials and try again.')
        }
        return
      }
      
      // Success - redirect immediately for better UX
      setSuccess('You have successfully logged in! Redirecting to dashboard...')
      // Use requestAnimationFrame for smooth transition without blocking
      requestAnimationFrame(() => {
        router.push('/')
      })
    } catch {
      setError('An error occurred during authentication. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-blue-100">
            <Shield className="h-6 w-6 text-blue-600" />
          </div>
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            TISCO Admin Panel
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Enter your access key to continue
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-center">Admin Authentication</CardTitle>
            <CardDescription className="text-center">
              Secure access to the admin dashboard
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={(e) => handleSubmit(e, accessKey)} className="space-y-6">
              <div>
                <label htmlFor="access-key" className="sr-only">
                  Access Key
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400" />
                  </div>
                  <Input
                    id="access-key"
                    name="access-key"
                    type="password"
                    autoComplete="current-password"
                    required
                    className="pl-10"
                    placeholder="Enter admin access key"
                    value={accessKey}
                    onChange={(e) => setAccessKey(e.target.value)}
                  />
                </div>
              </div>

              {error && (
                <div role="alert" className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                  {error}
                </div>
              )}

              {success && (
                <div role="alert" className="rounded-md border border-green-200 bg-green-50 p-3 text-sm text-green-700">
                  {success}
                </div>
              )}

              <Button
                type="submit"
                className="w-full"
                disabled={isLoading}
              >
                {isLoading ? 'Authenticating...' : 'Access Admin Panel'}
              </Button>
            </form>

            <div className="mt-6 text-center text-xs text-gray-500">Enter your administrator access key.</div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

