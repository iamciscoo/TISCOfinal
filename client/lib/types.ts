// Shared type definitions used across the application

export interface Product {
  id: string | number
  name: string
  description: string
  price: number
  image_url?: string
  image?: string
  category_id?: string | number
  category?: string
  categories?: Array<{ category: { id: string; name: string; slug?: string } }> | {
    id: string | number
    name: string
    slug: string
  }
  // Optional gallery images pulled from Supabase
  product_images?: ProductImage[]
  stock_quantity?: number
  rating?: number | null
  reviews_count?: number | null
  view_count?: number
  is_featured?: boolean
  is_new?: boolean
  // Deal pricing fields
  is_deal?: boolean
  original_price?: number
  deal_price?: number
  tags?: string[]
  brands?: string[]
  slug?: string
  created_at?: string
  updated_at?: string
}

export interface ProductImage {
  url?: string
  is_main?: boolean
  sort_order?: number
}

// Product review type used across components and API client
export interface Review {
  id: string
  rating: number
  title?: string
  comment?: string
  created_at: string
  is_verified_purchase?: boolean
  users?: {
    first_name: string
    last_name: string
    avatar_url?: string
  }
}

export interface Category {
  id: string | number
  name: string
  slug: string
  description?: string
  image_url?: string
  product_count?: number
  is_featured?: boolean
  parent_id?: string | number
  created_at?: string
  updated_at?: string
}

export interface CartItem {
  id: string
  productId: string | number
  name: string
  price: number
  quantity: number
  image_url?: string
  image?: string
}

export interface Order {
  id: string
  user_id: string
  status: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled'
  total_amount: number
  currency: string
  items: OrderItem[]
  shipping_address: Address
  billing_address?: Address
  payment_method: string
  payment_status: 'pending' | 'paid' | 'failed' | 'refunded' | 'cancelled'
  tracking_number?: string
  notes?: string
  created_at: string
  updated_at: string
}

export interface OrderItem {
  id: string
  order_id: string
  product_id: string | number
  product_name: string
  product_image?: string
  quantity: number
  price: number
  total: number
}

export interface Address {
  id?: string
  user_id?: string
  type?: 'shipping' | 'billing'
  first_name: string
  last_name: string
  company?: string
  address_line_1: string
  address_line_2?: string
  city: string
  state: string
  postal_code: string
  country: string
  phone?: string
  is_default?: boolean
}

export interface User {
  id: string
  email: string
  first_name?: string
  last_name?: string
  phone?: string
  avatar_url?: string
  is_verified: boolean
  created_at: string
  updated_at: string
}

// API Response types
export interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export interface PaginatedResponse<T = unknown> {
  data: T[]
  total: number
  page: number
  per_page: number
  total_pages: number
  has_next: boolean
  has_prev: boolean
}

// Form validation types
export interface ValidationError {
  field: string
  message: string
}

export interface FormState<T = unknown> {
  data: T
  errors: ValidationError[]
  isSubmitting: boolean
  isValid: boolean
}

// UI component types
export interface LoadingState {
  isLoading: boolean
  message?: string
}

export interface ErrorState {
  hasError: boolean
  message?: string
  code?: string
}

// Filter and search types
export interface ProductFilters {
  category?: string
  rating?: number
  in_stock?: boolean
  is_featured?: boolean
  tags?: string[]
}

export interface SearchParams {
  query?: string
  filters?: ProductFilters
  sort_by?: 'name' | 'price' | 'rating' | 'created_at'
  sort_order?: 'asc' | 'desc'
  page?: number
  per_page?: number
}

// Currency and localization types
export interface Currency {
  code: string
  symbol: string
  flag: string
  name: string
  exchange_rate?: number
}

export interface ExchangeRates {
  TZS: number
  USD: number
  EUR: number
  CNY: number
  timestamp: number
}

export interface CurrencyContextType {
  primaryCurrency: Currency
  secondaryCurrency: Currency
  exchangeRate: number
  formatPrice: (amount: number, currency?: Currency) => string
  convertPrice: (amount: number, fromCurrency: string, toCurrency: string) => number
  updateExchangeRate: () => Promise<void>
  switchCurrencies: () => void
}

// Admin types
export interface AdminUser extends User {
  role: 'admin' | 'manager' | 'editor'
  permissions: string[]
  last_login?: string
}

export interface AdminStats {
  total_products: number
  total_orders: number
  total_users: number
  total_revenue: number
  revenue_change: number
  orders_change: number
  users_change: number
}

// Service types
export interface Service {
  id: string
  title: string
  description: string
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>
  features: string[]
  image: string
  gallery: string[]
  duration?: string
}

export interface ServiceBooking {
  id: string
  service_id: string
  user_id: string
  service_type: string
  description: string
  preferred_date: string
  preferred_time: string
  contact_email: string
  contact_phone: string
  customer_name: string
  status: 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled'
  notes?: string
  created_at: string
  updated_at: string
}

// Utility types
export type Omit<T, K extends keyof T> = Pick<T, Exclude<keyof T, K>>
export type Partial<T> = {
  [P in keyof T]?: T[P]
}

export type StringOrNumber = string | number
export type Nullable<T> = T | null
export type Optional<T> = T | undefined