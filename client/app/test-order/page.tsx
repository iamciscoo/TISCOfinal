'use client'

import { useState } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function TestOrderPage() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)

  const createTestOrder = async () => {
    if (!user) {
      setResult({ error: 'Not authenticated' })
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          items: [
            {
              product_id: '1',
              quantity: 1,
              price: 10000
            }
          ],
          payment_method: 'office',
          currency: 'TZS',
          shipping_address: 'Test Address, Test City'
        })
      })

      const data = await response.json()
      setResult({ status: response.status, data })
    } catch (error) {
      setResult({ error: error instanceof Error ? error.message : 'Unknown error occurred' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto p-8">
      <Card>
        <CardHeader>
          <CardTitle>Test Order Creation</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <strong>User:</strong> {user ? user.email : 'Not authenticated'}
          </div>
          
          <Button 
            onClick={createTestOrder} 
            disabled={loading || !user}
          >
            {loading ? 'Creating Order...' : 'Create Test Order'}
          </Button>

          {result && (
            <div className="mt-4 p-4 bg-gray-100 rounded">
              <pre>{JSON.stringify(result, null, 2)}</pre>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
