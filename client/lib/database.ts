/**
 * Database abstraction layer for the TISCO e-commerce platform
 * 
 * This module provides a unified interface for data operations, abstracting away
 * the complexity of direct database queries and API calls. It serves as the primary
 * data access layer for the client application, ensuring consistent error handling
 * and data transformation across all components.
 * 
 * Key Features:
 * - Centralized data access patterns
 * - Consistent error handling and logging
 * - Type-safe operations with TypeScript
 * - Fallback mechanisms for failed operations
 * - Performance optimization through API client caching
 */

// Import the configured Supabase client for direct database operations
import { supabase } from './supabase'
import type { Product, User, Address, Category } from './types'
import { api } from './api-client'

/**
 * =============================================================================
 * PRODUCT DATA OPERATIONS
 * =============================================================================
 * 
 * These functions handle all product-related data operations including
 * fetching, filtering, and searching products from the catalog.
 */

/**
 * Retrieves a paginated list of products from the catalog
 * 
 * This function fetches products using the cached API client to improve
 * performance and reduce database load. It includes comprehensive error
 * handling to ensure the application remains stable even if the API fails.
 * 
 * @param limit - Maximum number of products to retrieve (default: 20)
 * @returns Promise<Product[]> - Array of product objects, empty array on failure
 * 
 * @example
 * ```typescript
 * // Get the first 10 products
 * const products = await getProducts(10);
 * 
 * // Get default number of products (20)
 * const allProducts = await getProducts();
 * ```
 */
export async function getProducts(limit: number = 20): Promise<Product[]> {
  try {
    // Use the cached API client instead of direct Supabase queries to:
    // 1. Leverage caching for better performance
    // 2. Avoid Row Level Security (RLS) complications
    // 3. Maintain consistency with admin panel data
    // 4. Reduce direct database connections
    const products = await api.getProducts(limit)
    
    // Type assertion ensures the returned data matches our Product interface
    // This is safe because the API client handles data validation
    return products as Product[]
  } catch (error) {
    // Log the error for monitoring and debugging purposes
    // Use structured logging format for better log parsing
    console.error('[database.getProducts] Failed to fetch via API:', error)
    
    // Return empty array instead of throwing to prevent UI crashes
    // This allows the application to gracefully handle API failures
    return []
  }
}

/**
 * Retrieves featured products for homepage and promotional displays
 * 
 * Featured products are specially marked items that should be prominently
 * displayed to users. This function is optimized for performance since
 * featured products are frequently accessed.
 * 
 * @param limit - Maximum number of featured products to retrieve (default: 9)
 * @returns Promise<unknown> - Array of featured product objects
 * 
 * @throws {Error} - Throws error if API call fails (unlike getProducts)
 * 
 * @example
 * ```typescript
 * // Get featured products for homepage hero section
 * const featured = await getFeaturedProducts(6);
 * 
 * // Get default number of featured products
 * const featuredDefault = await getFeaturedProducts();
 * ```
 */
export async function getFeaturedProducts(limit: number = 9) {
  try {
    // Fetch featured products through cached API client
    // Featured products are cached more aggressively due to frequent access
    const products = await api.getFeaturedProducts(limit)
    
    // Return as unknown type to allow flexible usage patterns
    // Components can cast to specific types as needed
    return products as unknown
  } catch (error) {
    // Log error for monitoring - featured products are critical for UX
    console.error('[database.getFeaturedProducts] Failed to fetch via API:', error)
    
    // Re-throw error because featured products are essential for homepage
    // Components should handle this error appropriately (show fallback content)
    throw error
  }
}

/**
 * Retrieves a single product by its unique identifier
 * 
 * This function is used for product detail pages and is heavily cached
 * since users often navigate back and forth between product details.
 * 
 * @param id - Unique product identifier (UUID string)
 * @returns Promise<Product | null> - Product object or null if not found
 * 
 * @example
 * ```typescript
 * // Get product for detail page
 * const product = await getProductById('550e8400-e29b-41d4-a716-446655440000');
 * if (product) {
 *   // Display product details
 * } else {
 *   // Show not found message
 * }
 * ```
 */
export async function getProductById(id: string): Promise<Product | null> {
  try {
    // Fetch single product through cached API client
    // Individual products are cached with longer TTL for better performance
    const product = await api.getProduct(id)
    
    // Type assertion ensures returned data matches Product interface
    return product as Product
  } catch (error) {
    // Log error with product ID for debugging specific product issues
    console.error('[database.getProductById] Failed to fetch via API:', error)
    
    // Return null instead of throwing to allow graceful "not found" handling
    // Components can check for null and show appropriate 404 content
    return null
  }
}

/**
 * Retrieves all products belonging to a specific category
 * 
 * This function supports category-based browsing and filtering.
 * Results are cached based on category ID for efficient navigation.
 * 
 * @param categoryId - Unique category identifier (UUID string)
 * @returns Promise<unknown> - Array of products in the specified category
 * 
 * @throws {Error} - Throws error if API call fails
 * 
 * @example
 * ```typescript
 * // Get all products in electronics category
 * const electronics = await getProductsByCategory('electronics-category-id');
 * ```
 */
export async function getProductsByCategory(categoryId: string) {
  try {
    // Fetch category products through cached API client
    // Category-based queries are cached to improve category page performance
    const products = await api.getProductsByCategory(categoryId)
    
    // Return as unknown to allow flexible casting in components
    return products as unknown
  } catch (error) {
    // Log error with category ID for debugging category-specific issues
    console.error('[database.getProductsByCategory] Failed to fetch via API:', error)
    
    // Re-throw error because category pages need to show meaningful errors
    // Components should handle this with appropriate error messaging
    throw error
  }
}

/**
 * =============================================================================
 * CATEGORY DATA OPERATIONS
 * =============================================================================
 * 
 * Functions for managing product categories, supporting hierarchical
 * category structures and category-based navigation.
 */

/**
 * Retrieves all product categories for navigation and filtering
 * 
 * Categories are used throughout the application for product organization
 * and navigation. This function is cached aggressively since categories
 * change infrequently but are accessed on every page load.
 * 
 * @returns Promise<Category[]> - Array of category objects, empty array on failure
 * 
 * @example
 * ```typescript
 * // Get all categories for main navigation
 * const categories = await getCategories();
 * const mainNavItems = categories.filter(cat => !cat.parent_id);
 * ```
 */
export async function getCategories(): Promise<Category[]> {
  try {
    // Fetch categories through cached API client for optimal performance
    // Categories are cached with extended TTL due to infrequent changes
    const categories = await api.getCategories()
    
    // Type assertion ensures returned data matches Category interface
    return categories as Category[]
  } catch (error) {
    // Log error for monitoring - categories are essential for navigation
    console.error('[database.getCategories] Failed to fetch via API:', error)
    
    // Return empty array to prevent navigation failures
    // UI should handle empty categories gracefully with fallback content
    return []
  }
}

/**
 * =============================================================================
 * SHOPPING CART DATA OPERATIONS
 * =============================================================================
 * 
 * Functions for managing shopping cart persistence and synchronization.
 * These operations use direct Supabase queries for real-time accuracy.
 */

/**
 * Adds a product to the user's shopping cart or updates existing quantity
 * 
 * This function handles the core cart functionality with intelligent
 * quantity management. If the product already exists in the cart,
 * it increments the quantity rather than creating duplicate entries.
 * 
 * @param userId - Unique user identifier (UUID string)
 * @param productId - Unique product identifier (UUID string)  
 * @param quantity - Number of items to add (default: 1)
 * @returns Promise<any> - Updated or newly created cart item data
 * 
 * @throws {Error} - Throws if database operation fails
 * 
 * @example
 * ```typescript
 * // Add single item to cart
 * await addToCart('user-123', 'product-456');
 * 
 * // Add multiple items at once
 * await addToCart('user-123', 'product-789', 3);
 * ```
 */
export async function addToCart(userId: string, productId: string, quantity: number = 1) {
  // First, check if the product already exists in the user's cart
  // This prevents duplicate entries and allows for quantity updates
  const { data: existingItem } = await supabase
    .from('cart_items')
    .select('id, quantity')  // Select only needed fields with explicit types
    .eq('user_id', userId)     // Filter by current user
    .eq('product_id', productId)  // Filter by specific product
    .single()  // Expect single result or null
  
  if (existingItem) {
    // Product already exists in cart - update the quantity
    // Add new quantity to existing quantity for cumulative effect
    const newQuantity = (existingItem.quantity as number) + quantity
    const { data, error } = await supabase
      .from('cart_items')
      .update({ quantity: newQuantity })  // Increment quantity with explicit type
      .eq('id', existingItem.id)  // Update specific cart item
      .select()  // Return updated data for confirmation
    
    // Throw error if update operation fails
    // This ensures calling code can handle database failures appropriately
    if (error) throw error
    return data
  } else {
    // Product doesn't exist in cart - create new cart item
    // Insert new record with user, product, and quantity information
    const { data, error } = await supabase
      .from('cart_items')
      .insert({ 
        user_id: userId,      // Associate with current user
        product_id: productId, // Reference the product
        quantity              // Set initial quantity
      })
      .select()  // Return inserted data for confirmation
    
    // Throw error if insert operation fails
    // This maintains consistency with the update path above
    if (error) throw error
    return data
  }
}

/**
 * Retrieves all items in a user's shopping cart with product details
 * 
 * This function performs a complex join query to fetch cart items along with
 * complete product information including images. The query is optimized for
 * cart display performance with proper image ordering.
 * 
 * @param userId - Unique user identifier (UUID string)
 * @returns Promise<any[]> - Array of cart items with nested product data
 * 
 * @throws {Error} - Throws if database query fails
 * 
 * @example
 * ```typescript
 * // Get user's cart for display
 * const cartItems = await getCartItems('user-123');
 * const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);
 * ```
 */
export async function getCartItems(userId: string) {
  // Perform complex join query to get cart items with full product details
  // This single query replaces multiple separate queries for better performance
  const { data, error } = await supabase
    .from('cart_items')  // Main cart items table
    .select(`
      *,  // All cart item fields (id, quantity, created_at, etc.)
      products (  // Join with products table for display information
        id,
        name,               // Product name for display
        price,              // Current price (may differ from order time)
        image_url,          // Primary product image
        product_images (    // Additional product images for gallery
          url,              // Image URL
          is_main,          // Whether this is the main product image
          sort_order        // Order for image display
        ),
        stock_quantity,     // Available inventory for validation
        is_active          // Whether product is still available
      )
    `)
    .eq('user_id', userId)  // Filter to current user's cart only
    // Order product images with main image first, then by sort order
    .order('is_main', { ascending: false, foreignTable: 'products.product_images' })
    .order('sort_order', { ascending: true, foreignTable: 'products.product_images' })
  
  // Throw error to allow calling code to handle database failures
  // Cart operations are critical and should not fail silently
  if (error) throw error
  return data
}

/**
 * Updates the quantity of a specific cart item
 * 
 * This function allows users to modify item quantities directly from
 * the cart interface. It validates the cart item belongs to the user
 * implicitly through the cartItemId parameter.
 * 
 * @param cartItemId - Unique cart item identifier (UUID string)
 * @param quantity - New quantity value (must be positive integer)
 * @returns Promise<any[]> - Updated cart item data
 * 
 * @throws {Error} - Throws if database update fails or item not found
 * 
 * @example
 * ```typescript
 * // Update item quantity to 5
 * await updateCartItemQuantity('cart-item-123', 5);
 * 
 * // Remove item by setting quantity to 0 (handled elsewhere)
 * // Use removeFromCart() instead for item removal
 * ```
 */
export async function updateCartItemQuantity(cartItemId: string, quantity: number) {
  // Update the quantity for the specific cart item
  // The cartItemId ensures we only update the correct item
  const { data, error } = await supabase
    .from('cart_items')
    .update({ quantity })  // Set new quantity value
    .eq('id', cartItemId)  // Target specific cart item
    .select()  // Return updated data for confirmation
  
  // Throw error if update fails (item not found, constraint violation, etc.)
  // Calling code should handle errors appropriately (show user feedback)
  if (error) throw error
  return data
}

/**
 * Removes a specific item completely from the user's cart
 * 
 * This function permanently deletes a cart item from the database.
 * Unlike updating quantity to 0, this operation cannot be undone
 * and should be used when user explicitly removes an item.
 * 
 * @param cartItemId - Unique cart item identifier (UUID string)
 * @returns Promise<void> - No return value on success
 * 
 * @throws {Error} - Throws if database deletion fails
 * 
 * @example
 * ```typescript
 * // Remove item from cart permanently
 * await removeFromCart('cart-item-123');
 * 
 * // This is irreversible - user would need to re-add the product
 * ```
 */
export async function removeFromCart(cartItemId: string) {
  // Permanently delete the cart item from the database
  // This operation is irreversible and removes all traces of the item
  const { error } = await supabase
    .from('cart_items')
    .delete()              // DELETE operation
    .eq('id', cartItemId)  // Target specific cart item by ID
  
  // Throw error if deletion fails (item not found, foreign key constraints, etc.)
  // Calling code should handle errors and provide user feedback
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
          image_url,
          product_images (
            url,
            is_main,
            sort_order
          )
        )
      )
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .order('is_main', { ascending: false, foreignTable: 'order_items.products.product_images' })
    .order('sort_order', { ascending: true, foreignTable: 'order_items.products.product_images' })
  
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

export async function createAddress(addressData: Omit<Address, 'id' | 'created_at'> & { user_id: string }) {
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

/**
 * Get all services for the services page
 * NOTE: Services table doesn't exist yet - placeholder function
 */
export async function getServices() {
  // TODO: Implement when services table is created
  console.warn('[database.getServices] Services table not implemented yet')
  return []
}

/**
 * Create service booking
 * NOTE: Service bookings table doesn't exist yet - placeholder function
 */
export async function createServiceBooking(bookingData: {
  service_id: string
  user_id: string
  description: string
  preferred_date: string
  preferred_time: string
  contact_email: string
  contact_phone?: string
  customer_name: string
}) {
  // TODO: Implement when service_bookings table is created
  console.warn('[database.createServiceBooking] Service bookings table not implemented yet')
  return { id: 'placeholder', ...bookingData }
}
