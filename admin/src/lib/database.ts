import { supabase } from './supabase'
import type { 
  Product, 
  Category, 
  User, 
  Order, 
  OrderItem, 
  Review, 
  Service, 
  ServiceBooking,
  AdminStats,
  DashboardData
} from './types'

// Product Functions
export async function getProducts(limit?: number): Promise<Product[]> {
  const query = supabase
    .from('products')
    .select(`
      *,
      category:categories(*),
      product_images(*)
    `)
    .order('created_at', { ascending: false })
    .order('sort_order', { ascending: true, foreignTable: 'product_images' })
    .order('created_at', { ascending: true, foreignTable: 'product_images' })

  if (limit) {
    query.limit(limit)
  }

  const { data, error } = await query

  if (error) throw error
  return data || []
}

export async function getProductById(id: string | number): Promise<Product | null> {
  const { data, error } = await supabase
    .from('products')
    .select(`
      *,
      category:categories(*),
      product_images(*)
    `)
    .order('sort_order', { ascending: true, foreignTable: 'product_images' })
    .order('created_at', { ascending: true, foreignTable: 'product_images' })
    .eq('id', id)
    .single()

  if (error) throw error
  return data
}

export async function createProduct(productData: Omit<Product, 'id' | 'created_at' | 'updated_at'>): Promise<Product> {
  const { data, error } = await supabase
    .from('products')
    .insert(productData)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function updateProduct(id: string | number, productData: Partial<Product>): Promise<Product> {
  const { data, error } = await supabase
    .from('products')
    .update({ ...productData, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function deleteProduct(id: string | number): Promise<void> {
  const { error } = await supabase
    .from('products')
    .delete()
    .eq('id', id)

  if (error) throw error
}

// Category Functions
export async function getCategories(): Promise<Category[]> {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .order('name')

  if (error) throw error
  return data || []
}

export async function createCategory(categoryData: Omit<Category, 'id' | 'created_at' | 'updated_at'>): Promise<Category> {
  const { data, error } = await supabase
    .from('categories')
    .insert(categoryData)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function updateCategory(id: string | number, categoryData: Partial<Category>): Promise<Category> {
  const { data, error } = await supabase
    .from('categories')
    .update({ ...categoryData, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function deleteCategory(id: string | number): Promise<void> {
  const { error } = await supabase
    .from('categories')
    .delete()
    .eq('id', id)

  if (error) throw error
}

// User Functions
export async function getUsers(limit?: number): Promise<User[]> {
  const query = supabase
    .from('users')
    .select('*')
    .order('created_at', { ascending: false })

  if (limit) {
    query.limit(limit)
  }

  const { data, error } = await query

  if (error) throw error
  return data || []
}

export async function getUserById(id: string): Promise<User | null> {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', id)
    .single()

  if (error) throw error
  return data
}

export async function updateUser(id: string, userData: Partial<User>): Promise<User> {
  const { data, error } = await supabase
    .from('users')
    .update({ ...userData, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}

// Order Functions
export async function getOrders(limit?: number): Promise<Order[]> {
  const query = supabase
    .from('orders')
    .select(`
      *,
      order_items:order_items(
        *,
        product:products(*)
      )
    `)
    .order('created_at', { ascending: false })

  if (limit) {
    query.limit(limit)
  }

  const { data, error } = await query

  if (error) throw error
  return data || []
}

export async function getOrderById(id: string | number): Promise<Order | null> {
  const { data, error } = await supabase
    .from('orders')
    .select(`
      *,
      order_items:order_items(
        *,
        product:products(*)
      )
    `)
    .eq('id', id)
    .single()

  if (error) throw error
  return data
}

export async function updateOrderStatus(id: string | number, status: Order['status']): Promise<Order> {
  const { data, error } = await supabase
    .from('orders')
    .update({ 
      status, 
      updated_at: new Date().toISOString() 
    })
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}

// Review Functions
export async function getReviews(limit?: number): Promise<Review[]> {
  const query = supabase
    .from('reviews')
    .select(`
      *,
      product:products(*),
      user:users(*)
    `)
    .order('created_at', { ascending: false })

  if (limit) {
    query.limit(limit)
  }

  const { data, error } = await query

  if (error) throw error
  return data || []
}

export async function updateReviewStatus(id: string | number, isApproved: boolean): Promise<Review> {
  const { data, error } = await supabase
    .from('reviews')
    .update({ 
      is_approved: isApproved,
      updated_at: new Date().toISOString() 
    })
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}

// Service Functions
export async function getServices(): Promise<Service[]> {
  const { data, error } = await supabase
    .from('services')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) throw error
  return data || []
}

export async function getServiceBookings(): Promise<ServiceBooking[]> {
  const { data, error } = await supabase
    .from('service_bookings')
    .select(`
      *,
      service:services(*),
      user:users(*)
    `)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data || []
}

// Dashboard Analytics
export async function getAdminStats(): Promise<AdminStats> {
  try {
    // Get total counts
    const [
      { count: totalProducts },
      { count: totalOrders },
      { count: totalUsers },
      { data: revenueData },
      { count: pendingOrders },
      { data: lowStockData }
    ] = await Promise.all([
      supabase.from('products').select('*', { count: 'exact', head: true }),
      supabase.from('orders').select('*', { count: 'exact', head: true }),
      supabase.from('users').select('*', { count: 'exact', head: true }),
      supabase.from('orders').select('total_amount').eq('payment_status', 'paid'),
      supabase.from('orders').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
      supabase.from('products').select('*').lt('stock_quantity', 10)
    ])

    const totalRevenue = (revenueData || []).reduce((sum: number, order: { total_amount: number | string }) =>
      sum + Number(order.total_amount ?? 0),
      0
    )

    return {
      totalProducts: totalProducts || 0,
      totalOrders: totalOrders || 0,
      totalUsers: totalUsers || 0,
      totalRevenue,
      pendingOrders: pendingOrders || 0,
      lowStockProducts: lowStockData?.length || 0
    }
  } catch (error) {
    console.error('Error fetching admin stats:', error)
    return {
      totalProducts: 0,
      totalOrders: 0,
      totalUsers: 0,
      totalRevenue: 0,
      pendingOrders: 0,
      lowStockProducts: 0
    }
  }
}

export async function getDashboardData(): Promise<DashboardData> {
  const emptyStats: AdminStats = {
    totalProducts: 0,
    totalOrders: 0,
    totalUsers: 0,
    totalRevenue: 0,
    pendingOrders: 0,
    lowStockProducts: 0,
  }

  const [statsRes, ordersRes, productsRes, usersRes] = await Promise.allSettled([
    getAdminStats(),
    getOrders(5),
    getProducts(5),
    getUsers(5),
  ])

  if (ordersRes.status === 'rejected') {
    console.error('Error fetching recent orders:', ordersRes.reason)
  }
  if (productsRes.status === 'rejected') {
    console.error('Error fetching top products:', productsRes.reason)
  }
  if (usersRes.status === 'rejected') {
    console.error('Error fetching recent users:', usersRes.reason)
  }

  return {
    stats: statsRes.status === 'fulfilled' ? statsRes.value : emptyStats,
    recentOrders: ordersRes.status === 'fulfilled' ? ordersRes.value : [],
    topProducts: productsRes.status === 'fulfilled' ? productsRes.value : [],
    recentUsers: usersRes.status === 'fulfilled' ? usersRes.value : [],
  }
}

