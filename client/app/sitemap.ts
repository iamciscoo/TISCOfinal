/**
 * ============================================================================
 * SITEMAP - Helping Google Find All Our Pages
 * ============================================================================
 * 
 * WHAT IS THIS FILE?
 * This creates a sitemap.xml file that tells search engines (like Google) 
 * about all the pages on our website. Think of it like a table of contents
 * in a book - it helps Google understand our site structure.
 * 
 * WHY IS THIS IMPORTANT?
 * - Helps Google find and index all our pages faster
 * - Tells Google which pages are most important (priority)
 * - Tells Google how often pages change (changeFrequency)
 * - Better SEO = More customers finding us on Google
 * 
 * WHEN IS THIS USED?
 * - Google crawls our site to index it
 * - Other search engines check for sitemap.xml
 * - SEO tools analyze our site structure
 * 
 * CONNECTED FILES:
 * - robots.txt (tells search engines where to find this sitemap)
 * - All page files (each page listed here must exist)
 * - layout.tsx (contains SEO metadata that works with this)
 * 
 * HOW IT WORKS:
 * Next.js automatically generates /sitemap.xml from this file.
 * Search engines access tiscomarket.store/sitemap.xml and see our pages.
 * ============================================================================
 */

// Import Next.js type for sitemap structure
// This ensures our sitemap follows the correct format
import { MetadataRoute } from 'next'
import { createClient } from '@supabase/supabase-js'

/**
 * SITEMAP GENERATOR FUNCTION
 * 
 * This function returns an array of all pages we want Google to know about.
 * Each page has:
 * - url: The full web address
 * - lastModified: When it was last updated
 * - changeFrequency: How often it changes
 * - priority: How important it is (0.0 to 1.0)
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Base URL of our website
  const baseUrl = 'https://tiscomarket.store'
  
  // Current date/time (used for lastModified)
  // .toISOString() converts date to format like "2024-12-15T10:30:00Z"
  const currentDate = new Date().toISOString()
  
  // Fetch dynamic product and category data from database
  let productUrls: MetadataRoute.Sitemap = []
  let categoryUrls: MetadataRoute.Sitemap = []
  
  try {
    // Initialize Supabase client
    if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE) {
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE
      )
      
      // Fetch all active products
      const { data: products } = await supabase
        .from('products')
        .select('id, updated_at, is_active, is_featured')
        .eq('is_active', true)
        .order('updated_at', { ascending: false })
        .limit(500) // Limit to 500 most recent products
      
      if (products && products.length > 0) {
        productUrls = products.map((product) => ({
          url: `${baseUrl}/products/${product.id}`,
          lastModified: product.updated_at || currentDate,
          changeFrequency: 'weekly' as const,
          priority: product.is_featured ? 0.8 : 0.7,
        }))
        console.log(`[SITEMAP] Added ${products.length} products`)
      }
      
      // Fetch all categories
      const { data: categories } = await supabase
        .from('categories')
        .select('name')
        .order('name', { ascending: true })
      
      if (categories && categories.length > 0) {
        categoryUrls = categories.map((category) => ({
          url: `${baseUrl}/products?category=${encodeURIComponent(category.name.toLowerCase().replace(/\s+/g, '-').replace(/&/g, 'and'))}`,
          lastModified: currentDate,
          changeFrequency: 'daily' as const,
          priority: 0.85,
        }))
        console.log(`[SITEMAP] Added ${categories.length} category pages`)
      }
    }
  } catch (error) {
    console.error('[SITEMAP] Error fetching dynamic data:', error)
    // Continue with static pages even if dynamic fetch fails
  }
  
  // Static pages array
  const staticPages: MetadataRoute.Sitemap = [
    // Homepage - highest priority (1.0 = most important)
    // Changes daily because we update featured products often
    {
      url: baseUrl,
      lastModified: currentDate,
      changeFrequency: 'daily',  // Google should check this daily
      priority: 1,               // Highest priority (1.0 = most important page)
    },
    // Products catalog - very high priority (0.9) for SEO
    // This is where customers shop! Changes daily with new products
    {
      url: `${baseUrl}/products`,
      lastModified: currentDate,
      changeFrequency: 'daily',   // New products added frequently
      priority: 0.9,               // Almost as important as homepage
    },
    
    // Services page - high priority (0.8)
    // PC building, repairs, office setup services
    {
      url: `${baseUrl}/services`,
      lastModified: currentDate,
      changeFrequency: 'weekly',   // Services don't change often
      priority: 0.8,
    },
    
    // Search functionality - important for user discovery
    // Helps customers find what they're looking for
    {
      url: `${baseUrl}/search`,
      lastModified: currentDate,
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    
    // Deals/Promotions page - high priority for conversions
    // Changes daily because deals expire and new ones added
    {
      url: `${baseUrl}/deals`,
      lastModified: currentDate,
      changeFrequency: 'daily',   // Deals change frequently
      priority: 0.7,
    },
    
    // About page - important for brand trust and authority
    // Tells our story and builds customer confidence
    {
      url: `${baseUrl}/about`,
      lastModified: currentDate,
      changeFrequency: 'monthly',  // Rarely changes
      priority: 0.7,
    },
    
    // Authentication pages - medium priority
    // Sign-in page - where existing customers log in
    {
      url: `${baseUrl}/auth/sign-in`,
      lastModified: currentDate,
      changeFrequency: 'monthly',  // UI changes rarely
      priority: 0.6,
    },
    
    // Sign-up page - where new customers create accounts
    {
      url: `${baseUrl}/auth/sign-up`,
      lastModified: currentDate,
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    
    // Contact page - medium priority
    // How customers reach us for support
    {
      url: `${baseUrl}/contact`,
      lastModified: currentDate,
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    
    // Shopping cart page - medium-low priority
    // Dynamic page that's different for each user
    {
      url: `${baseUrl}/cart`,
      lastModified: currentDate,
      changeFrequency: 'weekly',
      priority: 0.5,
    },
    
    // FAQ page - medium-low priority but good for SEO
    // Answers common customer questions
    {
      url: `${baseUrl}/faq`,
      lastModified: currentDate,
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    
    // Legal pages - lower priority (0.3)
    // Important for compliance but not for SEO ranking
    
    // Privacy policy - required by law
    {
      url: `${baseUrl}/privacy`,
      lastModified: currentDate,
      changeFrequency: 'yearly',  // Changes very rarely
      priority: 0.3,              // Low priority for Google
    },
    
    // Terms of service - legal requirements
    {
      url: `${baseUrl}/terms`,
      lastModified: currentDate,
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    
    // Cookie policy - GDPR compliance
    {
      url: `${baseUrl}/cookies`,
      lastModified: currentDate,
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    
    // Delivery guide - practical information for customers
    {
      url: `${baseUrl}/delivery-guide`,
      lastModified: currentDate,
      changeFrequency: 'monthly',  // Delivery policies may update
      priority: 0.4,
    },
  ]
  
  // Combine static pages with dynamic product and category URLs
  // This creates a comprehensive sitemap for Google to index
  const allPages = [...staticPages, ...categoryUrls, ...productUrls]
  
  console.log(`[SITEMAP] Generated sitemap with ${allPages.length} total URLs (${staticPages.length} static, ${categoryUrls.length} categories, ${productUrls.length} products)`)
  
  return allPages
}
