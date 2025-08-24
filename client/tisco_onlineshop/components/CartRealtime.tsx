'use client'

import { useRealtimeCart } from '@/hooks/use-realtime-cart'
import { useCartSync } from '@/hooks/use-cart-sync'

export default function CartRealtime() {
  useRealtimeCart()
  useCartSync()
  return null
}
