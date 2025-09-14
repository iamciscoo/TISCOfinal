'use client'

import { useState } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function TestMobilePaymentPage() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [sessionId, setSessionId] = useState<string>('')

  const createPaymentSession = async () => {
    if (!user) {
      setResult({ error: 'Not authenticated' })
      return
    }

    setLoading(true)
    try {
      // First create a payment session
      const sessionResponse = await fetch('/api/payments/initiate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: 10000,
          currency: 'TZS',
          provider: 'Vodacom M-Pesa',
          phone_number: '255744963858',
          order_data: {
            items: [
              {
                product_id: '1',
                quantity: 1,
                price: 10000
              }
            ],
            payment_method: 'mobile_money',
            shipping_address: 'Test Mobile Address, Test City',
            currency: 'TZS'
          }
        })
      })

      const sessionData = await sessionResponse.json()
      setResult({ step: 'session_created', data: sessionData })
      
      const ref = sessionData?.transaction?.transaction_reference || sessionData?.transaction_reference
      if (ref) {
        setSessionId(ref)
      }
    } catch (error) {
      setResult({ error: error instanceof Error ? error.message : 'Unknown error occurred' })
    } finally {
      setLoading(false)
    }
  }

  const triggerWebhook = async () => {
    if (!sessionId) {
      setResult({ error: 'No session ID available' })
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/payments/mock-webhook', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          transaction_reference: sessionId,
          status: 'COMPLETED'
        })
      })

      const data = await response.json()
      setResult({ step: 'webhook_triggered', data })
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
          <CardTitle>Test Mobile Payment Flow</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <strong>User:</strong> {user ? user.email : 'Not authenticated'}
          </div>
          
          <div className="space-x-2">
            <Button 
              onClick={createPaymentSession} 
              disabled={loading || !user}
            >
              {loading ? 'Creating Session...' : '1. Create Payment Session'}
            </Button>

            <Button 
              onClick={triggerWebhook} 
              disabled={loading || !sessionId}
            >
              {loading ? 'Triggering Webhook...' : '2. Trigger Success Webhook'}
            </Button>
          </div>

          {sessionId && (
            <div className="p-2 bg-blue-100 rounded">
              <strong>Session ID:</strong> {sessionId}
            </div>
          )}

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
