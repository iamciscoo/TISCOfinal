'use client'
import { useState, useEffect } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'

export const NewsletterForm = () => {
  const { toast } = useToast()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [hydrated, setHydrated] = useState(false)

  // Render this form only after client hydration to avoid SSR/extension attribute mismatches
  useEffect(() => {
    setHydrated(true)
  }, [])

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const trimmed = email.trim().toLowerCase()
    if (!trimmed) {
      toast({ title: 'Email required', description: 'Please enter your email.', variant: 'destructive' })
      return
    }

    try {
      setLoading(true)
      const res = await fetch('/api/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: trimmed })
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        throw new Error(data?.error || 'Failed to subscribe')
      }
      toast({ title: 'Subscribed', description: data?.message || 'You\'re on the list!' })
      setEmail('')
    } catch (err) {
      toast({ title: 'Error', description: err instanceof Error ? err.message : 'Failed to subscribe', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  if (!hydrated) return null

  return (
    <form onSubmit={onSubmit} className="space-y-2" suppressHydrationWarning>
      <Input
        type="email"
        placeholder="Enter your email"
        className="bg-gray-800 border-gray-700 text-white placeholder-gray-400"
        autoComplete="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
        suppressHydrationWarning
      />
      <Button type="submit" disabled={loading} className="w-full">
        {loading ? 'Subscribing…' : 'Subscribe'}
      </Button>
    </form>
  )
}
