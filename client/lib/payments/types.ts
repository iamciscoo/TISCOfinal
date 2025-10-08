/**
 * TISCO Mobile Payment System - Type Definitions
 * Clean, well-typed payment system for ZenoPay integration
 */

// ============================================================================
// Core Payment Types
// ============================================================================

export type PaymentProvider = 'M-Pesa' | 'Tigo Pesa' | 'Airtel Money' | 'Halopesa'

export type PaymentSessionStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'expired'

export type OrderStatus = 
  | 'pending' 
  | 'confirmed' 
  | 'processing' 
  | 'shipped' 
  | 'delivered' 
  | 'cancelled'

export type PaymentStatus = 
  | 'pending' 
  | 'paid' 
  | 'failed' 
  | 'refunded' 
  | 'cancelled'

// ============================================================================
// Order Data Structure
// ============================================================================

export interface OrderItem {
  product_id: string
  quantity: number
  price: number // Unit price in TZS
}

export interface OrderData {
  // Items
  items: OrderItem[]
  
  // Customer Info
  email: string
  first_name: string
  last_name: string
  phone?: string // Optional phone number
  contact_phone?: string // Legacy - formatted: +255 7XX XXX XXX
  
  // Delivery Info
  address_line_1?: string
  city?: string
  place?: string // Area/ward
  country?: string
  shipping_address: string // Full formatted address
  
  // Payment Info
  payment_method?: string
  currency?: string
  
  // Optional
  notes?: string
}

// ============================================================================
// Payment Session
// ============================================================================

export interface PaymentSession {
  id: string
  user_id: string
  amount: number
  currency: string
  provider: PaymentProvider
  phone_number: string // Phone used for payment
  transaction_reference: string // Unique ID sent to ZenoPay
  gateway_transaction_id: string | null // ZenoPay's transaction ID
  order_data: OrderData
  status: PaymentSessionStatus
  failure_reason: string | null
  created_at: string
  updated_at: string
  expires_at: string
}

// ============================================================================
// Request/Response Types
// ============================================================================

export interface InitiatePaymentRequest {
  amount: number
  currency: string
  provider: PaymentProvider
  phone_number: string
  order_data: OrderData
}

export interface InitiatePaymentResponse {
  success: boolean
  transaction_reference: string
  status: PaymentSessionStatus
  message: string
  session_id?: string
}

export interface PaymentStatusResponse {
  success: boolean
  status: PaymentSessionStatus
  order_id?: string
  message: string
}

// ============================================================================
// ZenoPay Webhook Types
// ============================================================================

export interface ZenoPayWebhookPayload {
  order_id: string // This is our transaction_reference
  payment_status: 'COMPLETED' | 'PENDING' | 'FAILED'
  reference: string // ZenoPay's internal reference
  amount?: string
  transid?: string // ZenoPay transaction ID
  channel?: string // e.g., 'MPESA-TZ'
  msisdn?: string // Customer phone number
}

// ============================================================================
// Database Insert Types
// ============================================================================

export interface CreateOrderInput {
  user_id: string
  total_amount: number
  currency: string
  status: OrderStatus
  payment_status: PaymentStatus
  payment_method: string
  shipping_address: string
  notes?: string
  paid_at?: string
}

export interface CreateOrderItemInput {
  order_id: string
  product_id: string
  quantity: number
  price: number
}

// ============================================================================
// Logging Types
// ============================================================================

export type PaymentLogEvent = 
  | 'payment_initiated'
  | 'payment_processing'
  | 'payment_completed'
  | 'payment_failed'
  | 'order_created'
  | 'order_creation_failed'
  | 'webhook_received'
  | 'webhook_processed'
  | 'webhook_error'
  | 'duplicate_prevented'
  | 'notification_sent'
  | 'notification_failed'

export interface PaymentLogData {
  event_type: PaymentLogEvent
  session_id?: string
  transaction_reference?: string
  order_id?: string
  error?: string
  details?: Record<string, unknown>
}

// ============================================================================
// Error Types
// ============================================================================

export class PaymentError extends Error {
  constructor(
    message: string,
    public code: string,
    public retryable: boolean = false,
    public details?: Record<string, unknown>
  ) {
    super(message)
    this.name = 'PaymentError'
  }
}

export class ValidationError extends PaymentError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, 'VALIDATION_ERROR', false, details)
    this.name = 'ValidationError'
  }
}

export class ZenoPayError extends PaymentError {
  constructor(message: string, retryable: boolean = true, details?: Record<string, unknown>) {
    super(message, 'ZENOPAY_ERROR', retryable, details)
    this.name = 'ZenoPayError'
  }
}

export class OrderCreationError extends PaymentError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, 'ORDER_CREATION_ERROR', false, details)
    this.name = 'OrderCreationError'
  }
}
