'use client'

import { useCartSync } from '@/hooks/use-cart-sync'

export default function CartRealtime() {
  useCartSync()
  return null
}
