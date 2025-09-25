/**
 * Database abstraction layer for the TISCO e-commerce platform
 * 
 * This module now uses the unified database system for optimal performance and consistency.
 * All operations are routed through the optimized connection manager with built-in
 * caching, performance monitoring, and connection pooling.
 * 
 * Key Features:
 * - Unified connection management with pooling
 * - Performance monitoring and caching
 * - Consistent error handling and logging
 * - Type-safe operations with TypeScript
 * - Automatic retry logic and fallback mechanisms
 */

// Import the new unified database system
import { 
  getProducts as _getProducts,
  getFeaturedProducts as _getFeaturedProducts,
  getProductById as _getProductById,
  getProductsByCategory as _getProductsByCategory,
  getCategories as _getCategories,
  addToCart as _addToCart,
  getCartItems as _getCartItems,
  updateCartItemQuantity as _updateCartItemQuantity,
  removeFromCart as _removeFromCart,
  createOrder as _createOrder,
  getUserOrders as _getUserOrders,
  createUser as _createUser,
  getUser as _getUser,
  getUserAddresses as _getUserAddresses,
  createAddress as _createAddress,
  getProductReviews as _getProductReviews,
  createReview as _createReview,
  getServices as _getServices,
  createServiceBooking as _createServiceBooking
} from './database-unified'
// Import shared type definitions for type safety
import type { Address, User, Product, Category } from './types'

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
  return _getProducts(limit)
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
export async function getFeaturedProducts(limit: number = 9): Promise<Product[]> {
  return _getFeaturedProducts(limit)
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
  return _getProductById(id)
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
export async function getProductsByCategory(categoryId: string): Promise<Product[]> {
  return _getProductsByCategory(categoryId)
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
  return _getCategories()
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
  return _addToCart(userId, productId, quantity)
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
  return _getCartItems(userId)
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
  return _updateCartItemQuantity(cartItemId, quantity)
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
  return _removeFromCart(cartItemId)
}

// Order Functions
export async function createOrder(userId: string, totalAmount: number, shippingAddress: string) {
  return _createOrder(userId, totalAmount, shippingAddress)
}

export async function getUserOrders(userId: string) {
  return _getUserOrders(userId)
}

// User Functions
export async function createUser(userData: Omit<User, 'created_at' | 'updated_at'>) {
  return _createUser(userData)
}

export async function getUser(userId: string) {
  return _getUser(userId)
}

// Address Functions
export async function getUserAddresses(userId: string) {
  return _getUserAddresses(userId)
}

export async function createAddress(addressData: Omit<Address, 'id' | 'created_at'>) {
  return _createAddress(addressData)
}

// Reviews Functions
export async function getProductReviews(productId: string) {
  return _getProductReviews(productId)
}

export async function createReview(reviewData: {
  product_id: string;
  user_id: string;
  rating: number;
  title?: string;
  comment?: string;
}) {
  return _createReview(reviewData)
}

// Services Functions
export async function getServices() {
  return _getServices()
}

export async function createServiceBooking(bookingData: {
  service_id: string;
  user_id: string;
  service_type: string;
  description: string;
  preferred_date: string;
  preferred_time: string;
  contact_email: string;
  contact_phone?: string;
  customer_name: string;
}) {
  return _createServiceBooking(bookingData)
}
