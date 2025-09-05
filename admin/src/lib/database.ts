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
  const { data: user, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', id)
    .single()

  if (error) throw error

  // Fetch the user's default shipping address (best-effort)
  const { data: addresses } = await supabase
    .from('addresses')
    .select('*')
    .eq('user_id', id)
    .eq('type', 'shipping')
    .order('is_default', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(1)

  const defaultAddress = Array.isArray(addresses) && addresses.length > 0 ? addresses[0] : undefined
  return { ...(user as any), default_shipping_address: defaultAddress }
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

export async function getUsersByIds(ids: string[]): Promise<Record<string, User>> {
  const unique = Array.from(new Set((ids || []).filter(Boolean))) as string[]
  if (unique.length === 0) return {}
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .in('id', unique)
  if (error) throw error
  const map: Record<string, User> = {}
  for (const u of data || []) {
    map[String((u as any).id)] = u
  }
  return map
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

  if (error) {
    console.error('getOrders: Supabase error', {
      message: error.message,
      code: (error as any).code,
      details: (error as any).details,
      hint: (error as any).hint,
    })
    throw error
  }

  const orders = (data || []) as any[]

  // Attach user information without relying on a DB FK between orders.user_id and users.id
  const userIds = Array.from(new Set(orders.map(o => o?.user_id).filter(Boolean))) as string[]
  let usersById: Record<string, User> = {}
  if (userIds.length > 0) {
    try {
      usersById = await getUsersByIds(userIds)
    } catch (e) {
      console.warn('getOrders: failed to fetch users for orders', e)
    }
  }

  return orders.map(o => ({ ...o, user: usersById[String(o.user_id)] })) as unknown as Order[]
}

export async function getOrdersByUser(userId: string): Promise<Order[]> {
  const { data, error } = await supabase
    .from('orders')
    .select(`
      *,
      order_items:order_items(
        *,
        product:products(*)
      )
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('getOrdersByUser: Supabase error', {
      message: error.message,
      code: (error as any).code,
      details: (error as any).details,
      hint: (error as any).hint,
    })
    throw error
  }

  return (data || []) as unknown as Order[]
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

  if (error) {
    console.error('getOrderById: Supabase error', {
      message: error.message,
      code: (error as any).code,
      details: (error as any).details,
      hint: (error as any).hint,
    })
    throw error
  }

  if (!data) return null

  // Enrich with user info independently of FK
  try {
    const user = await getUserById(String((data as any).user_id))
    return { ...(data as any), user } as unknown as Order
  } catch (e) {
    console.warn('getOrderById: failed to fetch user', e)
    return data as unknown as Order
  }
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
      { data: lowStockData },
      { data: serviceRevenueRows, error: serviceRevenueErr }
    ] = await Promise.all([
      supabase.from('products').select('*', { count: 'exact', head: true }),
      supabase.from('orders').select('*', { count: 'exact', head: true }),
      supabase.from('users').select('*', { count: 'exact', head: true }),
      supabase.from('orders').select('total_amount').eq('payment_status', 'paid'),
      supabase.from('orders').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
      supabase.from('products').select('*').lt('stock_quantity', 10),
      // Service revenue: paid service bookings; tolerate missing table/column
      supabase.from('service_bookings').select('total_amount,payment_status')
    ])

    const productRevenue = (revenueData || []).reduce((sum: number, order: { total_amount: number | string }) =>
      sum + Number(order.total_amount ?? 0),
      0
    )

    let serviceRevenue = 0
    if (!serviceRevenueErr && Array.isArray(serviceRevenueRows)) {
      serviceRevenue = (serviceRevenueRows as Array<{ total_amount: number | string; payment_status?: string }>).
        filter(r => String((r?.payment_status ?? '')).toLowerCase() === 'paid')
        .reduce((sum, r) => sum + Number(r.total_amount ?? 0), 0)
    } else if (serviceRevenueErr) {
      // Table or column may be missing; ignore and default to 0
      console.warn('Service revenue unavailable:', serviceRevenueErr.message)
    }

    const totalRevenue = productRevenue + serviceRevenue

    return {
      totalProducts: totalProducts || 0,
      totalOrders: totalOrders || 0,
      totalUsers: totalUsers || 0,
      totalRevenue,
      productRevenue,
      serviceRevenue,
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
      productRevenue: 0,
      serviceRevenue: 0,
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
    productRevenue: 0,
    serviceRevenue: 0,
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

// User Activity Helpers
export async function getUserMonthlyOrderActivity(userId: string, months = 6): Promise<{ month: string, orders: number }[]> {
  const now = new Date()
  const start = new Date(now.getFullYear(), now.getMonth() - (months - 1), 1)

  const { data, error } = await supabase
    .from('orders')
    .select('id, created_at')
    .eq('user_id', userId)
    .gte('created_at', start.toISOString())

  if (error) throw error

  // Prepare buckets for the last N months
  const buckets: { key: string; label: string }[] = []
  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    const label = d.toLocaleString('en-US', { month: 'long' })
    buckets.push({ key, label })
  }

  const counts = new Map<string, number>()
  for (const b of buckets) counts.set(b.key, 0)

  for (const row of data || []) {
    const created = new Date((row as any).created_at)
    const key = `${created.getFullYear()}-${String(created.getMonth() + 1).padStart(2, '0')}`
    if (counts.has(key)) counts.set(key, (counts.get(key) || 0) + 1)
  }

  return buckets.map(b => ({ month: b.label, orders: counts.get(b.key) || 0 }))
}

