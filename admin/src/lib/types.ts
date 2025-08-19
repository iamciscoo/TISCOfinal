// Database types for admin panel - matches client-side types
export interface Category {
  id: number
  name: string
  description: string
  created_at: string
  updated_at: string
}

export interface Product {
  id: number
  name: string
  description: string
  price: number
  image_url?: string
  category_id: number
  stock_quantity?: number
  is_featured: boolean
  is_active: boolean
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
}

export interface User {
  id: string
  email: string
  first_name?: string
  last_name?: string
  phone?: string
  date_of_birth?: string
  avatar_url?: string
  is_admin: boolean
  is_active: boolean
  last_login?: string
  created_at: string
  updated_at: string
}

export interface Address {
  id: number
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
  id: number
  user_id: string
  order_number: string
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled'
  total_amount: number
  shipping_amount: number
  tax_amount: number
  currency: string
  payment_method?: string
  payment_status: 'pending' | 'paid' | 'failed' | 'refunded'
  shipping_address: Address
  billing_address?: Address
  tracking_number?: string
  notes?: string
  created_at: string
  updated_at: string
  // Relations
  user?: User
  order_items?: OrderItem[]
}

export interface OrderItem {
  id: number
  order_id: number
  product_id: number
  quantity: number
  unit_price: number
  total_price: number
  created_at: string
  // Relations
  product?: Product
}

export interface Review {
  id: number
  product_id: number
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
  id: number
  name: string
  description: string
  price: number
  duration_hours: number
  is_active: boolean
  category: string
  requirements?: string[]
  image_url?: string
  created_at: string
  updated_at: string
}

export interface ServiceBooking {
  id: number
  service_id: number
  user_id: string
  status: 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled'
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
  pendingOrders: number
  lowStockProducts: number
}

export interface DashboardData {
  stats: AdminStats
  recentOrders: Order[]
  topProducts: Product[]
  recentUsers: User[]
}

