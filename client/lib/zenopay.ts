type ZenoPayConfig = {
  baseUrl: string
  apiKey: string
}

export interface CreateOrderArgs {
  buyer_name: string
  buyer_phone: string
  buyer_email: string
  amount: number | string
  order_id: string
  webhook_url?: string
  channel?: string
}

export class ZenoPayClient {
  private config: ZenoPayConfig

  constructor(config?: Partial<ZenoPayConfig>) {
    this.config = {
      // Default to public docs base: https://zenoapi.com/api/payments
      baseUrl: process.env.ZENOPAY_BASE_URL || 'https://zenoapi.com/api/payments',
      apiKey: process.env.ZENOPAY_API_KEY || '',
      ...config,
    } as ZenoPayConfig
  }

  async createOrder(args: CreateOrderArgs): Promise<unknown> {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 30000)

    try {
      // New API expects JSON body and x-api-key header
      const payload: Record<string, unknown> = {
        order_id: args.order_id,
        buyer_name: args.buyer_name,
        buyer_phone: args.buyer_phone,
        buyer_email: args.buyer_email,
        amount: args.amount,
      }
      // Always send webhook_url if provided (including localhost for testing)
      if (args.webhook_url) {
        payload.webhook_url = args.webhook_url
      }
      if (args.channel) {
        // Only include documented 'channel' when explicitly provided.
        payload.channel = args.channel
      }

      const url = `${this.config.baseUrl.replace(/\/$/, '')}/mobile_money_tanzania`
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'x-api-key': this.config.apiKey,
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      } as RequestInit)

      clearTimeout(timeoutId)

      if (!res.ok) {
        const text = await res.text().catch(() => '')
        throw new Error(`ZenoPay create order failed (${res.status}): ${text}`)
      }

      const json = await res.json().catch(async () => {
        const text = await res.text().catch(() => '')
        return { raw: text }
      })
      return json
    } catch (e) {
      clearTimeout(timeoutId)
      if (e instanceof Error && e.name === 'AbortError') {
        throw new Error('ZenoPay request timed out after 30 seconds')
      }
      throw e
    }
  }

  async getOrderStatus(orderId: string): Promise<unknown> {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 20000)
    try {
      const url = `${this.config.baseUrl.replace(/\/$/, '')}/order-status?order_id=${encodeURIComponent(orderId)}`
      const res = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'x-api-key': this.config.apiKey,
        },
        signal: controller.signal,
      } as RequestInit)

      clearTimeout(timeoutId)

      if (!res.ok) {
        const text = await res.text().catch(() => '')
        throw new Error(`ZenoPay status check failed (${res.status}): ${text}`)
      }
      const json = await res.json().catch(async () => {
        const text = await res.text().catch(() => '')
        return { raw: text }
      })
      return json
    } catch (e) {
      clearTimeout(timeoutId)
      if (e instanceof Error && e.name === 'AbortError') {
        throw new Error('ZenoPay status request timed out after 20 seconds')
      }
      throw e
    }
  }
}

