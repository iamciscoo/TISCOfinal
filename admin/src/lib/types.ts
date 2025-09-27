// Database types for admin panel - matches client-side types
export interface Category {
  id: string | number
  name: string
  description: string
  created_at: string
  updated_at: string
}

export interface Product {
  id: string | number
  name: string
  description: string
  price: number
  image_url?: string
  category_id: string | number
  stock_quantity?: number
  is_featured: boolean
  is_active: boolean
  // deal fields
  is_deal?: boolean
  original_price?: number | null
  deal_price?: number | null
  rating?: number
  reviews_count?: number
  discount_percentage?: number
  tags?: string[]
  weight?: number
  dimensions?: string
  sku?: string
  created_at: string
  updated_at: string
  // Relations
  category?: Category
  product_images?: ProductImage[]
}

export interface ProductImage {
  id: string
  product_id: string
  url: string
  path?: string
  is_main: boolean
  sort_order: number
  created_at: string
}

export interface User {
  id: string
  email: string
  first_name?: string
  last_name?: string
  phone?: string
  date_of_birth?: string
  avatar_url?: string
  is_admin?: boolean
  is_active?: boolean
  last_login?: string
  created_at: string
  updated_at: string
  // Relations (admin computed)
  default_shipping_address?: Address
}

export interface Address {
  id: string | number
  user_id: string
  type: 'shipping' | 'billing'
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
  is_default: boolean
  created_at: string
  updated_at: string
}

export interface Order {
  id: string | number
  user_id: string
  order_number?: string
  status: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled'
  total_amount: number
  shipping_amount: number
  tax_amount: number
  currency: string
  payment_method?: string
  payment_status: 'pending' | 'paid' | 'failed' | 'refunded' | 'cancelled'
  // Note: In the current DB schema, shipping_address is a TEXT column.
  // It may be stored as a raw string, or (in future) reference an Address object.
  shipping_address: string | Address
  billing_address?: string | Address
  tracking_number?: string
  notes?: string
  created_at: string
  updated_at: string
  // Relations
  user?: User
  order_items?: OrderItem[]
}

export interface OrderItem {
  id: string | number
  order_id: string | number
  product_id: string | number
  quantity: number
  price: number  // Database uses 'price' not 'unit_price'
  created_at: string
  // Relations - handle both naming conventions
  product?: Product
  products?: Product
}

export interface Review {
  id: string | number
  product_id: string | number
  user_id: string
  rating: number
  comment?: string
  is_verified: boolean
  is_approved: boolean
  created_at: string
  updated_at: string
  // Relations
  product?: Product
  user?: User
}

export interface Service {
  id: string
  title: string
  description: string
  features: string[]
  duration: string
  image: string
  gallery: string[]
  created_at: string
  updated_at: string
}

export interface ServiceBooking {
  id: string | number
  service_id: string | number
  user_id: string
  status: 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled'
  payment_status?: 'pending' | 'paid' | 'failed' | 'refunded' | 'cancelled'
  scheduled_date: string
  total_amount: number
  notes?: string
  created_at: string
  updated_at: string
  // Relations
  service?: Service
  user?: User
}

// Admin-specific types
export interface AdminStats {
  totalProducts: number
  totalOrders: number
  totalUsers: number
  totalRevenue: number
  productRevenue: number
  serviceRevenue: number
  pendingOrders: number
  lowStockProducts: number
}

export interface DashboardData {
  stats: AdminStats
  recentOrders: Order[]
  topProducts: Product[]
  recentUsers: User[]
}

