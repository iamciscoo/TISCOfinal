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
  try {
    // Check Supabase connection first
    if (!supabase) {
      console.error('Supabase client not initialized')
      return []
    }

    let query = supabase
      .from('products')
      .select(`
        *,
        categories:product_categories(
          category:categories(*)
        ),
        product_images(
          id,
          url,
          is_main,
          sort_order,
          created_at
        )
      `)
      .order('is_featured', { ascending: false })
      .order('created_at', { ascending: false })
    
    if (limit) {
      query = query.limit(limit)
    }
    
    const { data, error } = await query
    
    if (error) {
      console.error('Supabase error in getProducts:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      })
      return []
    }
    
    return data || []
  } catch (error) {
    console.error('Network/Connection error in getProducts:', error)
    return []
  }
}

export async function getProductById(id: string | number): Promise<Product | null> {
  try {
    const { data, error } = await supabase
      .from('products')
      .select(`
        *,
        categories:product_categories(
          category:categories(*)
        ),
        product_images(
          id,
          url,
          is_main,
          sort_order,
          created_at,
          path
        )
      `)
      .eq('id', id)
      .single()
    
    if (error) {
      console.error('Error in getProductById:', error)
      throw error
    }
    return data
  } catch (error) {
    console.error('[ Server ] Error fetching product by id:', error)
    return null
  }
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
  try {
    // Check Supabase connection first
    if (!supabase) {
      console.error('Supabase client not initialized for getUsers')
      return []
    }

    let query = supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false })

    if (limit) {
      query = query.limit(limit)
    }

    const { data, error } = await query

    if (error) {
      console.error('Supabase error in getUsers:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      })
      return []
    }
    
    return data || []
  } catch (error) {
    console.error('Network/Connection error in getUsers:', error)
    return []
  }
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
  
  // Logging disabled to reduce console noise
  // console.log('getUsersByIds: Fetching users for IDs:', unique)
  
  try {
    // Use the service role client to bypass RLS - only select columns that exist
    const { data, error } = await supabase
      .from('users')
      .select('id, email, first_name, last_name, created_at, phone, updated_at')
      .in('id', unique)
      
    if (error) {
      console.error('Direct query failed:', error.message, error.code)
      
      // Fall back to manual query for each ID (sometimes IN clause has issues)
      const fallbackResults: any[] = []
      for (const userId of unique) {
        try {
          const { data: singleUser, error: singleError } = await supabase
            .from('users')
            .select('id, email, first_name, last_name, created_at, phone, updated_at')
            .eq('id', userId)
            .single()
          
          if (singleUser && !singleError) {
            fallbackResults.push(singleUser)
          }
        } catch (e) {
          console.warn('Failed to fetch single user:', userId)
        }
      }
      
      if (fallbackResults.length > 0) {
        const map: Record<string, User> = {}
        for (const u of fallbackResults) {
          map[String(u.id)] = u as User
        }
        console.log(`getUsersByIds: Fallback success - loaded ${Object.keys(map).length} users`)
        return map
      }
      
      return {}
    }
    
    const map: Record<string, User> = {}
    for (const u of data || []) {
      // Map the data with default values for missing fields
      map[String(u.id)] = {
        ...u,
        is_admin: false, // Default since column doesn't exist
        is_active: true  // Default since column doesn't exist
      } as User
    }
    
    // Logging disabled to reduce console noise
    // console.log(`getUsersByIds: Direct query success - loaded ${Object.keys(map).length} users`)
    
    return map
  } catch (error) {
    console.error('getUsersByIds unexpected error:', error)
    return {}
  }
}

// Order Functions
export async function getOrders(limit?: number): Promise<Order[]> {
  try {
    // Check Supabase connection first
    if (!supabase) {
      console.error('Supabase client not initialized for getOrders')
      return []
    }

    let query = supabase
      .from('orders')
      .select(`
        *,
        order_items(
          id,
          quantity,
          price,
          products(
            id,
            name,
            price,
            image_url,
            is_deal,
            deal_price,
            original_price
          )
        )
      `)
      .order('created_at', { ascending: false })

    if (limit) {
      query = query.limit(limit)
    }

    const { data, error } = await query

    if (error) {
      console.error('getOrders: Supabase error', {
        message: error.message,
        code: (error as any).code,
        details: (error as any).details,
        hint: (error as any).hint,
      })
      // Return empty array instead of throwing to prevent dashboard crashes
      return []
    }

    const orders = (data || []) as any[]

    // Batch user fetching for better performance
    const userIds = Array.from(new Set(orders.map(o => o?.user_id).filter(Boolean))) as string[]
    let usersById: Record<string, User> = {}
    if (userIds.length > 0) {
      try {
        usersById = await getUsersByIds(userIds)
      } catch (e) {
        console.warn('getOrders: failed to fetch users for orders', e)
      }
    }

    return orders.map(o => {
      if (o.user_id) {
        // Registered customer - use user data
        return { ...o, user: usersById[String(o.user_id)] }
      } else {
        // Guest customer - create a user-like object from guest fields
        return { 
          ...o, 
          user: {
            id: null,
            email: o.customer_email || 'No email',
            first_name: o.customer_name?.split(' ')[0] || 'Guest',
            last_name: o.customer_name?.split(' ').slice(1).join(' ') || 'Customer',
            phone: o.customer_phone || null,
            is_guest: true
          }
        }
      }
    }) as unknown as Order[]
  } catch (error) {
    console.error('Network/Connection error in getOrders:', error)
    return []
  }
}

export async function getOrdersByUser(userId: string): Promise<Order[]> {
  const { data, error } = await supabase
    .from('orders')
    .select(`
      *,
      order_items(
        *,
        products(*)
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
      order_items(
        *,
        products(
          id,
          name,
          image_url,
          price,
          description,
          is_deal,
          deal_price,
          original_price
        )
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
      products(*),
      users(*)
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
      id,
      service_id,
      user_id,
      service_type,
      description,
      preferred_date,
      preferred_time,
      contact_email,
      contact_phone,
      customer_name,
      status,
      notes,
      created_at,
      updated_at,
      total_amount,
      payment_status,
      services!inner(
        id,
        title,
        description
      )
    `)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('getServiceBookings: Supabase error', {
      message: error.message,
      code: (error as any).code,
      details: (error as any).details,
      hint: (error as any).hint,
    })
    return []
  }

  const bookings = (data || []) as any[]

  // Batch user fetching for better performance
  const userIds = Array.from(new Set(bookings.map(b => b?.user_id).filter(Boolean))) as string[]
  let usersById: Record<string, User> = {}
  if (userIds.length > 0) {
    try {
      usersById = await getUsersByIds(userIds)
    } catch (e) {
      console.warn('getServiceBookings: failed to fetch users for bookings', e)
    }
  }

  return bookings.map(b => ({ ...b, user: usersById[String(b.user_id)] })) as unknown as ServiceBooking[]
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


// =========================
// Revenue Analytics Helpers
// =========================

// Types local to this module to avoid polluting global types
type DailyPoint = { date: string; total: number; products: number; services: number; successful: number }
type TopItem = { id: string | number; name: string; revenue: number; quantity?: number }
type PaymentBreakdown = { method: string; amount: number }

function normalizeMethod(method?: string | null) {
  const m = String(method || '').trim().toLowerCase()
  if (!m) return 'unknown'
  if (m.includes('mobile')) return 'mobile money'
  if (m.includes('zeno')) return 'mobile money'
  if (m.includes('cash')) return 'cash'
  if (m.includes('office')) return 'pay at office'
  if (m.includes('card')) return 'card'
  return m
}

// Combine orders and service bookings by day
export async function getDailyRevenue(days = 30): Promise<DailyPoint[]> {
  try {
    const now = new Date()
    const start = new Date(now)
    start.setDate(now.getDate() - (days - 1))

    // Prepare day buckets
    const buckets = new Map<string, DailyPoint>()
    for (let i = 0; i < days; i++) {
      const d = new Date(start)
      d.setDate(start.getDate() + i)
      const key = d.toISOString().slice(0, 10)
      buckets.set(key, { date: key, total: 0, products: 0, services: 0, successful: 0 })
    }

    // Orders (products)
    const { data: orders, error: ordersErr } = await supabase
      .from('orders')
      .select('created_at,total_amount,payment_status')
      .gte('created_at', start.toISOString())

    if (!ordersErr) {
      for (const row of (orders || []) as Array<{ created_at: string; total_amount: number | string; payment_status?: string }>) {
        const key = new Date(row.created_at).toISOString().slice(0, 10)
        if (!buckets.has(key)) continue
        const amt = Number(row.total_amount ?? 0)
        const b = buckets.get(key)!
        b.total += amt
        b.products += amt
        if (String(row.payment_status).toLowerCase() === 'paid') b.successful += amt
      }
    }

    // Service bookings
    try {
      const { data: bookings, error: svcErr } = await supabase
        .from('service_bookings')
        .select('created_at,total_amount,payment_status')
        .gte('created_at', start.toISOString())

      if (!svcErr) {
        for (const row of (bookings || []) as Array<{ created_at: string; total_amount: number | string; payment_status?: string }>) {
          const key = new Date(row.created_at).toISOString().slice(0, 10)
          if (!buckets.has(key)) continue
          const amt = Number(row.total_amount ?? 0)
          const b = buckets.get(key)!
          b.total += amt
          b.services += amt
          if (String(row.payment_status || '').toLowerCase() === 'paid') b.successful += amt
        }
      }
    } catch (e) {
      // Ignore missing service bookings table/columns
    }

    return Array.from(buckets.values())
  } catch (e) {
    console.error('getDailyRevenue error', e)
    return []
  }
}

// Top products by revenue (from order_items of PAID orders)
export async function getTopProductsByRevenue(limit = 5, days = 90): Promise<TopItem[]> {
  try {
    const start = new Date()
    start.setDate(start.getDate() - days)

    // Load paid orders in range
    const { data: orders, error: ordersErr } = await supabase
      .from('orders')
      .select('id, created_at')
      .eq('payment_status', 'paid')
      .gte('created_at', start.toISOString())

    if (ordersErr || !Array.isArray(orders) || orders.length === 0) return []

    const orderIds = orders.map(o => (o as any).id)

    // Fetch order_items with product relation; handle both relation names
    const { data: items, error: itemsErr } = await supabase
      .from('order_items')
      .select('product_id, quantity, price, products ( id, name )')
      .in('order_id', orderIds as any)

    if (itemsErr || !Array.isArray(items)) return []

    const map = new Map<string | number, TopItem>()
    for (const it of items as Array<any>) {
      const revenue = Number(it.price ?? 0) * Number(it.quantity ?? 0)
      const pid = it.product_id
      const prod = it.products || it.product
      const name = prod?.name || `Product ${pid}`
      const cur = map.get(pid) || { id: pid, name, revenue: 0, quantity: 0 }
      cur.revenue += revenue
      cur.quantity = (cur.quantity || 0) + Number(it.quantity ?? 0)
      cur.name = name
      map.set(pid, cur)
    }

    const sorted = Array.from(map.values()).sort((a, b) => b.revenue - a.revenue)
    return sorted.slice(0, limit)
  } catch (e) {
    console.error('getTopProductsByRevenue error', e)
    return []
  }
}

// Top services by revenue (paid bookings)
export async function getTopServicesByRevenue(limit = 5, days = 90): Promise<TopItem[]> {
  try {
    const start = new Date()
    start.setDate(start.getDate() - days)

    try {
      const { data, error } = await supabase
        .from('service_bookings')
        .select('service_id,total_amount,payment_status,services ( id, title )')
        .gte('created_at', start.toISOString())
        
      if (error) {
        const msg = String(error.message || '').toLowerCase()
        if (msg.includes('does not exist')) return []
        return []
      }

      const map = new Map<string | number, TopItem>()
      for (const row of (data || []) as Array<any>) {
        if (String(row.payment_status || '').toLowerCase() !== 'paid') continue
        const id = row.service_id
        const title = row.services?.title || `Service ${id}`
        const cur = map.get(id) || { id, name: title, revenue: 0 }
        cur.revenue += Number(row.total_amount ?? 0)
        cur.name = title
        map.set(id, cur)
      }

      const sorted = Array.from(map.values()).sort((a, b) => b.revenue - a.revenue)
      return sorted.slice(0, limit)
    } catch {
      return []
    }
  } catch (e) {
    console.error('getTopServicesByRevenue error', e)
    return []
  }
}

// Payment method breakdown for PAID orders
export async function getPaymentMethodBreakdown(days = 90): Promise<PaymentBreakdown[]> {
  try {
    const start = new Date()
    start.setDate(start.getDate() - days)

    const { data, error } = await supabase
      .from('orders')
      .select('payment_method,total_amount,payment_status,created_at')
      .eq('payment_status', 'paid')
      .gte('created_at', start.toISOString())

    if (error) return []

    const totals = new Map<string, number>()
    for (const row of (data || []) as Array<any>) {
      const key = normalizeMethod(row.payment_method)
      totals.set(key, (totals.get(key) || 0) + Number(row.total_amount ?? 0))
    }

    return Array.from(totals.entries()).map(([method, amount]) => ({ method, amount }))
  } catch (e) {
    console.error('getPaymentMethodBreakdown error', e)
    return []
  }
}

// KPI metrics for cards on revenue page
export async function getRevenueKPIs() {
  try {
    const now = new Date()
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

    // Today + month for orders
    const [ordersToday, ordersMonth] = await Promise.all([
      supabase.from('orders').select('total_amount,payment_status,created_at').gte('created_at', startOfDay.toISOString()),
      supabase.from('orders').select('total_amount,payment_status,created_at').gte('created_at', startOfMonth.toISOString()),
    ])

    const sumPaid = (rows: any[] | null | undefined) =>
      (rows || []).filter(r => String(r.payment_status).toLowerCase() === 'paid').reduce((s, r) => s + Number(r.total_amount ?? 0), 0)

    const countPaid = (rows: any[] | null | undefined) =>
      (rows || []).filter(r => String(r.payment_status).toLowerCase() === 'paid').length

    const todayOrdersRevenue = sumPaid(ordersToday.data as any[])
    const monthOrdersRevenue = sumPaid(ordersMonth.data as any[])
    const paidOrdersCount = countPaid(ordersMonth.data as any[])

    // Average order value (paid orders in month)
    const avgOrderValue = paidOrdersCount > 0 ? Math.round(monthOrdersRevenue / paidOrdersCount) : 0

    // Service bookings (best-effort)
    let todaySvcRevenue = 0
    let monthSvcRevenue = 0
    let paidBookingsCount = 0
    try {
      const [svcToday, svcMonth] = await Promise.all([
        supabase.from('service_bookings').select('total_amount,payment_status,created_at').gte('created_at', startOfDay.toISOString()),
        supabase.from('service_bookings').select('total_amount,payment_status,created_at').gte('created_at', startOfMonth.toISOString()),
      ])
      const sumPaidBookings = (rows: any[] | null | undefined) =>
        (rows || []).filter(r => String(r.payment_status).toLowerCase() === 'paid').reduce((s, r) => s + Number(r.total_amount ?? 0), 0)
      todaySvcRevenue = sumPaidBookings(svcToday.data as any[])
      monthSvcRevenue = sumPaidBookings(svcMonth.data as any[])
      paidBookingsCount = countPaid(svcMonth.data as any[])
    } catch {}

    return {
      todayRevenue: todayOrdersRevenue + todaySvcRevenue,
      monthRevenue: monthOrdersRevenue + monthSvcRevenue,
      paidOrdersCount,
      paidBookingsCount,
      avgOrderValue,
    }
  } catch (e) {
    console.error('getRevenueKPIs error', e)
    return { todayRevenue: 0, monthRevenue: 0, paidOrdersCount: 0, paidBookingsCount: 0, avgOrderValue: 0 }
  }
}

// Revenue by Category (using product_categories junction table)
type CategoryRevenue = { category_id: string | null; category_name: string; revenue: number; orders_count: number }
export async function getRevenueByCategory(days = 90): Promise<CategoryRevenue[]> {
  try {
    const start = new Date()
    start.setDate(start.getDate() - days)

    // Get paid orders with items
    const { data: orders, error: ordersErr } = await supabase
      .from('orders')
      .select('id, created_at')
      .eq('payment_status', 'paid')
      .gte('created_at', start.toISOString())

    if (ordersErr || !orders?.length) return []

    const orderIds = orders.map(o => o.id)

    // Get order items with products
    const { data: items, error: itemsErr } = await supabase
      .from('order_items')
      .select('price, quantity, product_id')
      .in('order_id', orderIds as any)

    if (itemsErr || !items?.length) return []

    // Get unique product IDs
    const productIds = [...new Set(items.map((i: any) => i.product_id))].filter(Boolean)

    // Get product categories from junction table
    const { data: productCategories, error: pcErr } = await supabase
      .from('product_categories')
      .select(`
        product_id,
        category:categories(id, name)
      `)
      .in('product_id', productIds as any)

    if (pcErr) {
      console.error('Error fetching product categories:', pcErr)
      return []
    }

    // Build product to categories map
    const productCategoryMap = new Map<string, any[]>()
    for (const pc of (productCategories || []) as any[]) {
      if (!productCategoryMap.has(pc.product_id)) {
        productCategoryMap.set(pc.product_id, [])
      }
      if (pc.category) {
        productCategoryMap.get(pc.product_id)!.push(pc.category)
      }
    }

    // Aggregate by category (full revenue attributed to each category)
    const categoryMap = new Map<string, CategoryRevenue>()
    
    for (const item of items as any[]) {
      const revenue = Number(item.price ?? 0) * Number(item.quantity ?? 0)
      const categories = productCategoryMap.get(item.product_id) || []
      
      if (categories.length === 0) {
        // Uncategorized products
        const key = 'uncategorized'
        const current = categoryMap.get(key) || {
          category_id: null,
          category_name: 'Uncategorized',
          revenue: 0,
          orders_count: 0
        }
        current.revenue += revenue
        current.orders_count += 1
        categoryMap.set(key, current)
      } else {
        // Attribute full revenue to each category (products can be in multiple categories)
        for (const category of categories) {
          const key = category.id
          const current = categoryMap.get(key) || {
            category_id: category.id,
            category_name: category.name,
            revenue: 0,
            orders_count: 0
          }
          current.revenue += revenue
          current.orders_count += 1
          categoryMap.set(key, current)
        }
      }
    }

    return Array.from(categoryMap.values()).sort((a, b) => b.revenue - a.revenue)
  } catch (e) {
    console.error('getRevenueByCategory error', e)
    return []
  }
}

// Revenue Trends (compare current period vs previous period)
type RevenueTrends = {
  currentPeriodRevenue: number
  previousPeriodRevenue: number
  growthPercentage: number
  currentOrders: number
  previousOrders: number
  ordersGrowth: number
}
export async function getRevenueTrends(days = 30): Promise<RevenueTrends> {
  try {
    const now = new Date()
    const currentStart = new Date(now)
    currentStart.setDate(now.getDate() - days)
    
    const previousStart = new Date(currentStart)
    previousStart.setDate(currentStart.getDate() - days)

    // Current period - Orders (Products)
    const { data: currentOrders } = await supabase
      .from('orders')
      .select('total_amount, payment_status')
      .gte('created_at', currentStart.toISOString())
      .lte('created_at', now.toISOString())

    // Previous period - Orders (Products)
    const { data: previousOrders } = await supabase
      .from('orders')
      .select('total_amount, payment_status')
      .gte('created_at', previousStart.toISOString())
      .lte('created_at', currentStart.toISOString())

    // Current period - Service Bookings
    const { data: currentBookings } = await supabase
      .from('service_bookings')
      .select('total_amount, payment_status')
      .gte('created_at', currentStart.toISOString())
      .lte('created_at', now.toISOString())

    // Previous period - Service Bookings
    const { data: previousBookings } = await supabase
      .from('service_bookings')
      .select('total_amount, payment_status')
      .gte('created_at', previousStart.toISOString())
      .lte('created_at', currentStart.toISOString())

    const sumPaidOrders = (rows: any[] | null | undefined) =>
      (rows || []).filter(r => String(r.payment_status).toLowerCase() === 'paid')
        .reduce((s, r) => s + Number(r.total_amount ?? 0), 0)

    const sumPaidBookings = (rows: any[] | null | undefined) =>
      (rows || []).filter(r => String(r.payment_status).toLowerCase() === 'paid')
        .reduce((s, r) => s + Number(r.total_amount ?? 0), 0)

    const countPaid = (rows: any[] | null | undefined) =>
      (rows || []).filter(r => String(r.payment_status).toLowerCase() === 'paid').length

    // Calculate total revenue including both orders and bookings
    const currentPeriodRevenue = sumPaidOrders(currentOrders) + sumPaidBookings(currentBookings)
    const previousPeriodRevenue = sumPaidOrders(previousOrders) + sumPaidBookings(previousBookings)
    const currentOrdersCount = countPaid(currentOrders)
    const previousOrdersCount = countPaid(previousOrders)

    const growthPercentage = previousPeriodRevenue > 0
      ? ((currentPeriodRevenue - previousPeriodRevenue) / previousPeriodRevenue) * 100
      : 0

    const ordersGrowth = previousOrdersCount > 0
      ? ((currentOrdersCount - previousOrdersCount) / previousOrdersCount) * 100
      : 0

    return {
      currentPeriodRevenue,
      previousPeriodRevenue,
      growthPercentage: Math.round(growthPercentage * 10) / 10,
      currentOrders: currentOrdersCount,
      previousOrders: previousOrdersCount,
      ordersGrowth: Math.round(ordersGrowth * 10) / 10
    }
  } catch (e) {
    console.error('getRevenueTrends error', e)
    return {
      currentPeriodRevenue: 0,
      previousPeriodRevenue: 0,
      growthPercentage: 0,
      currentOrders: 0,
      previousOrders: 0,
      ordersGrowth: 0
    }
  }
}

// Conversion Rate (paid orders vs total orders)
type ConversionMetrics = {
  totalOrders: number
  paidOrders: number
  pendingOrders: number
  failedOrders: number
  conversionRate: number
  averageProcessingTime: number // hours
}
export async function getConversionMetrics(days = 30): Promise<ConversionMetrics> {
  try {
    const start = new Date()
    start.setDate(start.getDate() - days)

    const { data: orders } = await supabase
      .from('orders')
      .select('payment_status, created_at, paid_at')
      .gte('created_at', start.toISOString())

    if (!orders?.length) {
      return {
        totalOrders: 0,
        paidOrders: 0,
        pendingOrders: 0,
        failedOrders: 0,
        conversionRate: 0,
        averageProcessingTime: 0
      }
    }

    const totalOrders = orders.length
    const paidOrders = orders.filter(o => String(o.payment_status).toLowerCase() === 'paid').length
    const pendingOrders = orders.filter(o => String(o.payment_status).toLowerCase() === 'pending').length
    const failedOrders = orders.filter(o => String(o.payment_status).toLowerCase() === 'failed').length
    const conversionRate = (paidOrders / totalOrders) * 100

    // Calculate average processing time for paid orders
    const paidWithTimes = orders.filter(o => 
      String(o.payment_status).toLowerCase() === 'paid' && o.paid_at
    )
    
    let averageProcessingTime = 0
    if (paidWithTimes.length > 0) {
      const totalHours = paidWithTimes.reduce((sum, o) => {
        const created = new Date(o.created_at).getTime()
        const paid = new Date(o.paid_at!).getTime()
        return sum + (paid - created) / (1000 * 60 * 60) // convert to hours
      }, 0)
      averageProcessingTime = totalHours / paidWithTimes.length
    }

    return {
      totalOrders,
      paidOrders,
      pendingOrders,
      failedOrders,
      conversionRate: Math.round(conversionRate * 10) / 10,
      averageProcessingTime: Math.round(averageProcessingTime * 10) / 10
    }
  } catch (e) {
    console.error('getConversionMetrics error', e)
    return {
      totalOrders: 0,
      paidOrders: 0,
      pendingOrders: 0,
      failedOrders: 0,
      conversionRate: 0,
      averageProcessingTime: 0
    }
  }
}

// Revenue by Payment Method with more details
type PaymentMethodDetails = {
  method: string
  revenue: number
  orderCount: number
  averageOrderValue: number
  percentage: number
}
export async function getPaymentMethodDetails(days = 90): Promise<PaymentMethodDetails[]> {
  try {
    const start = new Date()
    start.setDate(start.getDate() - days)

    const { data, error } = await supabase
      .from('orders')
      .select('payment_method, total_amount, payment_status')
      .eq('payment_status', 'paid')
      .gte('created_at', start.toISOString())

    if (error || !data?.length) return []

    const methodMap = new Map<string, { revenue: number; count: number }>()
    let totalRevenue = 0

    for (const order of data as any[]) {
      const method = normalizeMethod(order.payment_method)
      const amount = Number(order.total_amount ?? 0)
      totalRevenue += amount

      const current = methodMap.get(method) || { revenue: 0, count: 0 }
      current.revenue += amount
      current.count += 1
      methodMap.set(method, current)
    }

    const details: PaymentMethodDetails[] = []
    for (const [method, stats] of methodMap.entries()) {
      details.push({
        method,
        revenue: stats.revenue,
        orderCount: stats.count,
        averageOrderValue: Math.round(stats.revenue / stats.count),
        percentage: totalRevenue > 0 ? (stats.revenue / totalRevenue) * 100 : 0
      })
    }

    return details.sort((a, b) => b.revenue - a.revenue)
  } catch (e) {
    console.error('getPaymentMethodDetails error', e)
    return []
  }
}

// =========================
// Expense Tracking Functions
// =========================

export type Expense = {
  id: string
  amount: number
  category: string
  description: string
  expense_date: string
  frequency: 'one-time' | 'daily' | 'weekly' | 'monthly' | 'yearly'
  notes?: string
  receipt_url?: string
  created_by?: string
  created_at: string
  updated_at: string
}

export type ExpenseSummary = {
  totalExpenses: number
  expenseCount: number
  byCategory: { category: string; amount: number; count: number }[]
  byFrequency: { frequency: string; amount: number; count: number }[]
}

export type NetProfitMetrics = {
  revenue: number
  expenses: number
  netProfit: number
  profitMargin: number
  dailyAverage: number
  monthlyProjection: number
}

// Get all expenses with optional date range and category filter
export async function getExpenses(params?: {
  startDate?: string
  endDate?: string
  category?: string
  frequency?: string
  limit?: number
}): Promise<Expense[]> {
  try {
    let query = supabase
      .from('expenses')
      .select('*')
      .order('expense_date', { ascending: false })

    if (params?.startDate) {
      query = query.gte('expense_date', params.startDate)
    }
    if (params?.endDate) {
      query = query.lte('expense_date', params.endDate)
    }
    if (params?.category) {
      query = query.eq('category', params.category)
    }
    if (params?.frequency) {
      query = query.eq('frequency', params.frequency)
    }
    if (params?.limit) {
      query = query.limit(params.limit)
    }

    const { data, error } = await query

    if (error) {
      console.error('getExpenses error:', error)
      return []
    }

    return (data || []) as Expense[]
  } catch (e) {
    console.error('getExpenses error', e)
    return []
  }
}

// Get expense summary for a date range
export async function getExpenseSummary(days = 30): Promise<ExpenseSummary> {
  try {
    const start = new Date()
    start.setDate(start.getDate() - days)

    const { data, error } = await supabase
      .from('expenses')
      .select('amount, category, frequency, expense_date')
      .gte('expense_date', start.toISOString().split('T')[0])

    if (error || !data?.length) {
      return {
        totalExpenses: 0,
        expenseCount: 0,
        byCategory: [],
        byFrequency: []
      }
    }

    const totalExpenses = data.reduce((sum, e) => sum + Number(e.amount ?? 0), 0)
    const expenseCount = data.length

    // Group by category
    const categoryMap = new Map<string, { amount: number; count: number }>()
    for (const expense of data as any[]) {
      const cat = expense.category || 'Other'
      const current = categoryMap.get(cat) || { amount: 0, count: 0 }
      current.amount += Number(expense.amount ?? 0)
      current.count += 1
      categoryMap.set(cat, current)
    }

    const byCategory = Array.from(categoryMap.entries())
      .map(([category, stats]) => ({ category, ...stats }))
      .sort((a, b) => b.amount - a.amount)

    // Group by frequency
    const frequencyMap = new Map<string, { amount: number; count: number }>()
    for (const expense of data as any[]) {
      const freq = expense.frequency || 'one-time'
      const current = frequencyMap.get(freq) || { amount: 0, count: 0 }
      current.amount += Number(expense.amount ?? 0)
      current.count += 1
      frequencyMap.set(freq, current)
    }

    const byFrequency = Array.from(frequencyMap.entries())
      .map(([frequency, stats]) => ({ frequency, ...stats }))
      .sort((a, b) => b.amount - a.amount)

    return {
      totalExpenses,
      expenseCount,
      byCategory,
      byFrequency
    }
  } catch (e) {
    console.error('getExpenseSummary error', e)
    return {
      totalExpenses: 0,
      expenseCount: 0,
      byCategory: [],
      byFrequency: []
    }
  }
}

// Calculate net profit (revenue - expenses) for a period
export async function getNetProfitMetrics(days = 30): Promise<NetProfitMetrics> {
  try {
    const start = new Date()
    start.setDate(start.getDate() - days)
    const startDateStr = start.toISOString().split('T')[0]

    // Get revenue from paid orders (products)
    const { data: orders } = await supabase
      .from('orders')
      .select('total_amount, payment_status, created_at')
      .eq('payment_status', 'paid')
      .gte('created_at', start.toISOString())

    const ordersRevenue = (orders || []).reduce((sum, o) => sum + Number(o.total_amount ?? 0), 0)

    // Get revenue from paid service bookings
    const { data: bookings } = await supabase
      .from('service_bookings')
      .select('total_amount, payment_status, created_at')
      .eq('payment_status', 'paid')
      .gte('created_at', start.toISOString())

    const bookingsRevenue = (bookings || []).reduce((sum, b) => sum + Number(b.total_amount ?? 0), 0)

    // Total revenue = orders + service bookings
    const revenue = ordersRevenue + bookingsRevenue

    // Get expenses
    const { data: expenseData } = await supabase
      .from('expenses')
      .select('amount, expense_date, frequency')
      .gte('expense_date', startDateStr)

    let totalExpenses = 0
    const now = new Date()
    const periodStart = start
    const periodEnd = now

    // Calculate recurring expenses within the period
    for (const expense of (expenseData || []) as any[]) {
      const amount = Number(expense.amount ?? 0)
      const expenseDate = new Date(expense.expense_date)
      
      // If expense started after the period, skip it
      if (expenseDate > periodEnd) continue
      
      // Calculate the actual start date within our period
      const effectiveStart = expenseDate > periodStart ? expenseDate : periodStart
      const effectiveEnd = periodEnd
      
      // Calculate days this expense applies within the period
      const daysActive = Math.max(0, Math.floor((effectiveEnd.getTime() - effectiveStart.getTime()) / (1000 * 60 * 60 * 24)) + 1)
      
      switch (expense.frequency) {
        case 'one-time':
          // One-time expense: add once if within period
          totalExpenses += amount
          break
        case 'daily':
          // Daily expense: multiply by days active in period
          totalExpenses += amount * daysActive
          break
        case 'weekly':
          // Weekly expense: multiply by number of weeks in active period
          const weeksActive = Math.floor(daysActive / 7)
          totalExpenses += amount * weeksActive
          break
        case 'monthly':
          // Monthly expense: multiply by number of months in active period
          const monthsActive = Math.floor(daysActive / 30)
          totalExpenses += amount * monthsActive
          break
        case 'yearly':
          // Yearly expense: prorate based on days active
          const yearlyProrated = (amount / 365) * daysActive
          totalExpenses += yearlyProrated
          break
      }
    }

    const netProfit = revenue - totalExpenses
    const profitMargin = revenue > 0 ? (netProfit / revenue) * 100 : 0
    const dailyAverage = netProfit / days
    const monthlyProjection = dailyAverage * 30

    return {
      revenue,
      expenses: totalExpenses,
      netProfit,
      profitMargin,
      dailyAverage,
      monthlyProjection
    }
  } catch (e) {
    console.error('getNetProfitMetrics error', e)
    return {
      revenue: 0,
      expenses: 0,
      netProfit: 0,
      profitMargin: 0,
      dailyAverage: 0,
      monthlyProjection: 0
    }
  }
}

// Add a new expense
export async function addExpense(expense: Omit<Expense, 'id' | 'created_at' | 'updated_at'>) {
  try {
    const { data, error } = await supabase
      .from('expenses')
      .insert([expense])
      .select()
      .single()

    if (error) {
      console.error('addExpense error:', error)
      return { success: false, error: error.message }
    }

    return { success: true, data }
  } catch (e: any) {
    console.error('addExpense error', e)
    return { success: false, error: e.message }
  }
}

// Update an expense
export async function updateExpense(id: string, updates: Partial<Expense>) {
  try {
    const { data, error } = await supabase
      .from('expenses')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('updateExpense error:', error)
      return { success: false, error: error.message }
    }

    return { success: true, data }
  } catch (e: any) {
    console.error('updateExpense error', e)
    return { success: false, error: e.message }
  }
}

// Delete an expense
export async function deleteExpense(id: string) {
  try {
    const { error } = await supabase
      .from('expenses')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('deleteExpense error:', error)
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (e: any) {
    console.error('deleteExpense error', e)
    return { success: false, error: e.message }
  }
}

// Get expense categories (distinct values)
export async function getExpenseCategories(): Promise<string[]> {
  try {
    const { data, error } = await supabase
      .from('expenses')
      .select('category')
    
    if (error || !data) return []

    const uniqueCategories = [...new Set(data.map((e: any) => e.category))]
    return uniqueCategories.sort()
  } catch (e) {
    console.error('getExpenseCategories error', e)
    return []
  }
}

