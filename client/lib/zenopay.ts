type ZenoPayConfig = {
  baseUrl: string
  apiKey: string
}

/**
 * ZenoPay API Create Order Parameters
 * Based on official ZenoPay documentation
 * @see https://zenoapi.com/docs
 */
export interface CreateOrderArgs {
  /** Customer's full name */
  buyer_name: string
  /** Tanzanian phone number in format: 07XXXXXXXX or 06XXXXXXXX */
  buyer_phone: string
  /** Customer's email address */
  buyer_email: string
  /** Payment amount in TZS (Tanzanian Shillings) */
  amount: number | string
  /** Unique order identifier (UUID recommended) */
  order_id: string
  /** Optional webhook URL for payment status notifications */
  webhook_url?: string
  /** 
   * Optional channel parameter for provider routing
   * NOTE: This parameter is NOT documented in official ZenoPay API docs.
   * Possible values: 'vodacom', 'tigo', 'airtel', 'halotel'
   * May be ignored by ZenoPay or used for internal routing.
   */
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

  /**
   * Create a mobile money payment order
   * @param args - Payment order parameters
   * @returns ZenoPay API response
   * @throws Error if request fails or times out
   */
  async createOrder(args: CreateOrderArgs): Promise<unknown> {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 30000)

    try {
      // Build payload according to ZenoPay API specification
      const payload: Record<string, unknown> = {
        order_id: args.order_id,
        buyer_name: args.buyer_name,
        buyer_phone: args.buyer_phone,
        buyer_email: args.buyer_email,
        amount: args.amount,
      }
      
      // Optional: Include webhook URL for payment status callbacks
      if (args.webhook_url) {
        payload.webhook_url = args.webhook_url
      }
      
      // Optional: Include channel parameter (undocumented)
      // This parameter is not in official docs but may help with payment routing
      if (args.channel) {
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

  /**
   * Check the status of a payment order
   * @param orderId - The unique order_id used when creating the order
   * @returns ZenoPay API response with order status
   * @throws Error if request fails or times out
   */
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

