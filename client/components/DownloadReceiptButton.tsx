'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Download } from 'lucide-react'
import { downloadReceipt } from '@/lib/receipt-generator'
import { useToast } from '@/hooks/use-toast'

interface OrderItem {
  id: string
  quantity: number
  price: number
  product_id?: string
  products?: {
    id: string
    name: string
    price: number
    image_url: string | null
  } | null
}

interface User {
  first_name?: string | null
  last_name?: string | null
  email?: string
  phone?: string | null
}

interface Order {
  id: string
  created_at: string
  total_amount: number
  status: string
  payment_status?: string
  payment_method?: string | null
  customer_name?: string | null
  customer_email?: string | null
  customer_phone?: string | null
  shipping_address?: string | null
  notes?: string | null
  order_items?: OrderItem[]
  user?: User | null
}

interface DownloadReceiptButtonProps {
  order: Order
}

export function DownloadReceiptButton({ order }: DownloadReceiptButtonProps) {
  const [isDownloading, setIsDownloading] = useState(false)
  const { toast } = useToast()

  // Only show button if payment status is 'paid'
  if (order.payment_status !== 'paid') {
    return null
  }

  const handleDownload = async () => {
    try {
      setIsDownloading(true)
      await downloadReceipt(order)
      toast({
        title: 'Success',
        description: 'Receipt downloaded successfully',
        variant: 'default',
      })
    } catch (error) {
      console.error('Failed to download receipt:', error)
      toast({
        title: 'Error',
        description: 'Failed to download receipt. Please try again.',
        variant: 'destructive',
      })
    } finally {
      setIsDownloading(false)
    }
  }

  return (
    <Button 
      onClick={handleDownload} 
      disabled={isDownloading}
      variant="outline"
      className="w-full"
    >
      <Download className="mr-2 h-4 w-4" />
      {isDownloading ? 'Generating...' : 'Download Receipt'}
    </Button>
  )
}
