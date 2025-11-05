/**
 * URL utilities for generating SEO-friendly product URLs
 */

/**
 * Converts a product name to a URL-safe slug
 * @param name - Product name
 * @returns URL-safe slug
 */
export function createProductSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    // Replace spaces and special chars with hyphens
    .replace(/[\s_]+/g, '-')
    // Remove any characters that aren't alphanumeric or hyphens
    .replace(/[^a-z0-9-]/g, '')
    // Remove consecutive hyphens
    .replace(/-+/g, '-')
    // Remove leading/trailing hyphens
    .replace(/^-+|-+$/g, '')
}

/**
 * Generates a full product URL path with slug and ID
 * @param productName - Product name
 * @param productId - Product UUID
 * @returns URL path like /products/product-name/uuid
 */
export function getProductUrl(productName: string, productId: string): string {
  const slug = createProductSlug(productName)
  return `/products/${slug}/${productId}`
}

/**
 * Extracts product ID from slug array (supports both old and new formats)
 * @param slugArray - Array from Next.js [...slug] dynamic route
 * @returns Product ID (UUID)
 * 
 * Supports:
 * - Legacy: /products/[uuid] → slug = [uuid]
 * - New: /products/[slug]/[uuid] → slug = [slug, uuid]
 */
export function extractProductId(slugArray: string[]): string {
  // If array has 2 elements, it's the new format: [slug, uuid]
  // Return the last element (uuid)
  if (slugArray.length === 2) {
    return slugArray[1]
  }
  
  // If array has 1 element, it's legacy format: [uuid]
  // Return the only element
  return slugArray[0]
}
