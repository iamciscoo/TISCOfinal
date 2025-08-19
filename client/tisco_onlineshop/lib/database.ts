import { supabase } from './supabase'
import type { Product, Category, CartItem, Order, Address, User } from './types'

// Product Functions
export async function getProducts(limit: number = 20) {
  const { data, error } = await supabase
    .from('products')
    .select(`
      *,
      categories (
        id,
        name
      )
    `)
    .limit(limit)
  
  if (error) throw error
  return data
}

export async function getProductById(id: string) {
  const { data, error } = await supabase
    .from('products')
    .select(`
      *,
      categories (
        id,
        name
      )
    `)
    .eq('id', id)
    .single()
  
  if (error) throw error
  return data
}

export async function getProductsByCategory(categoryId: string) {
  const { data, error } = await supabase
    .from('products')
    .select(`
      *,
      categories (
        id,
        name
      )
    `)
    .eq('category_id', categoryId)
  
  if (error) throw error
  return data
}

// Category Functions
export async function getCategories() {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .order('name')
  
  if (error) throw error
  return data
}

// Cart Functions
export async function addToCart(userId: string, productId: string, quantity: number = 1) {
  // Check if item already exists in cart
  const { data: existingItem } = await supabase
    .from('cart_items')
    .select('*')
    .eq('user_id', userId)
    .eq('product_id', productId)
    .single()
  
  if (existingItem) {
    // Update quantity
    const { data, error } = await supabase
      .from('cart_items')
      .update({ quantity: existingItem.quantity + quantity })
      .eq('id', existingItem.id)
      .select()
    
    if (error) throw error
    return data
  } else {
    // Insert new item
    const { data, error } = await supabase
      .from('cart_items')
      .insert({ user_id: userId, product_id: productId, quantity })
      .select()
    
    if (error) throw error
    return data
  }
}

export async function getCartItems(userId: string) {
  const { data, error } = await supabase
    .from('cart_items')
    .select(`
      *,
      products (
        id,
        name,
        price,
        image_url
      )
    `)
    .eq('user_id', userId)
  
  if (error) throw error
  return data
}

export async function updateCartItemQuantity(cartItemId: string, quantity: number) {
  const { data, error } = await supabase
    .from('cart_items')
    .update({ quantity })
    .eq('id', cartItemId)
    .select()
  
  if (error) throw error
  return data
}

export async function removeFromCart(cartItemId: string) {
  const { error } = await supabase
    .from('cart_items')
    .delete()
    .eq('id', cartItemId)
  
  if (error) throw error
}

// Order Functions
export async function createOrder(userId: string, totalAmount: number, shippingAddress: string) {
  const { data, error } = await supabase
    .from('orders')
    .insert({
      user_id: userId,
      total_amount: totalAmount,
      shipping_address: shippingAddress,
      status: 'pending'
    })
    .select()
    .single()
  
  if (error) throw error
  return data
}

export async function getUserOrders(userId: string) {
  const { data, error } = await supabase
    .from('orders')
    .select(`
      *,
      order_items (
        *,
        products (
          id,
          name,
          image_url
        )
      )
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
  
  if (error) throw error
  return data
}

// User Functions
export async function createUser(userData: Omit<User, 'created_at' | 'updated_at'>) {
  const { data, error } = await supabase
    .from('users')
    .insert(userData)
    .select()
    .single()
  
  if (error) throw error
  return data
}

export async function getUser(userId: string) {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single()
  
  if (error) throw error
  return data
}

// Address Functions
export async function getUserAddresses(userId: string) {
  const { data, error } = await supabase
    .from('addresses')
    .select('*')
    .eq('user_id', userId)
    .order('is_default', { ascending: false })
  
  if (error) throw error
  return data
}

export async function createAddress(addressData: Omit<Address, 'id' | 'created_at'>) {
  const { data, error } = await supabase
    .from('addresses')
    .insert(addressData)
    .select()
    .single()
  
  if (error) throw error
  return data
}

// Reviews Functions
export async function getProductReviews(productId: string) {
  const { data, error } = await supabase
    .from('reviews')
    .select(`
      *,
      users (
        first_name,
        last_name,
        avatar_url
      )
    `)
    .eq('product_id', productId)
    .order('created_at', { ascending: false })
  
  if (error) throw error
  return data
}

export async function createReview(reviewData: {
  product_id: string
  user_id: string
  rating: number
  title?: string
  comment?: string
}) {
  const { data, error } = await supabase
    .from('reviews')
    .insert(reviewData)
    .select()
    .single()
  
  if (error) throw error
  return data
}

// Services Functions
export async function getServices() {
  const { data, error } = await supabase
    .from('services')
    .select('*')
    .order('is_popular', { ascending: false })
  
  if (error) throw error
  return data
}

export async function createServiceBooking(bookingData: {
  service_id: string
  user_id: string
  service_type: string
  description: string
  preferred_date: string
  preferred_time: string
  contact_email: string
  contact_phone?: string
  customer_name: string
}) {
  const { data, error } = await supabase
    .from('service_bookings')
    .insert(bookingData)
    .select()
    .single()
  
  if (error) throw error
  return data
}
