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
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      // Simple access key validation
      const adminKey = process.env.NEXT_PUBLIC_ADMIN_ACCESS_KEY || 'admin_secret_key_123'
      
      if (accessKey === adminKey) {
        // Set admin token cookie (no secure flag for local dev; use SameSite=Lax)
        document.cookie = `admin-token=${accessKey}; path=/; max-age=86400; samesite=lax`
        router.push('/')
      } else {
        setError('Invalid access key. Please check your credentials.')
      }
    } catch (err) {
      setError('An error occurred. Please try again.')
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
            <form onSubmit={handleLogin} className="space-y-6">
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

              <Button
                type="submit"
                className="w-full"
                disabled={isLoading}
              >
                {isLoading ? 'Authenticating...' : 'Access Admin Panel'}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <div className="text-xs text-gray-500 bg-gray-50 p-3 rounded-md">
                <p className="font-semibold mb-1">For Development:</p>
                <p>Default access key: <code className="bg-gray-200 px-1 rounded">admin_secret_key_123</code></p>
                <p className="mt-1">Change this in production!</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

