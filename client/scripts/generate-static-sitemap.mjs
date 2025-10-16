/**
 * ============================================================================
 * STATIC SITEMAP GENERATOR WITH CATEGORY DATA
 * ============================================================================
 * 
 * This script generates a static sitemap.xml file with:
 * - All categories from database with descriptions
 * - High-quality favicon images  
 * - SEO-optimized structure
 * 
 * Run this script after database changes to update the static sitemap:
 * npm run generate-sitemap
 * 
 * The sitemap.ts file handles dynamic generation at build time,
 * but this creates a static fallback with rich metadata.
 * ============================================================================
 */

import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import dotenv from 'dotenv'

// Load environment variables
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const envPath = path.join(__dirname, '..', '.env.local')
dotenv.config({ path: envPath })

async function generateStaticSitemap() {
  console.log('🚀 Generating static sitemap with category data...\n')

  // Initialize Supabase client
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE) {
    throw new Error('Missing Supabase environment variables. Make sure .env.local is configured.')
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE
  )

  // Fetch categories from database
  const { data: categories, error: categoryError } = await supabase
    .from('categories')
    .select('name, description')
    .order('name', { ascending: true })

  if (categoryError) {
    console.error('❌ Error fetching categories:', categoryError)
    throw categoryError
  }

  console.log(`✅ Fetched ${categories?.length || 0} categories from database`)

  // Fetch top products
  const { data: products, error: productError } = await supabase
    .from('products')
    .select('id, name, updated_at, is_featured')
    .eq('is_active', true)
    .order('updated_at', { ascending: false })
    .limit(100) // Top 100 products for static sitemap

  if (productError) {
    console.error('⚠️  Error fetching products:', productError)
  }

  console.log(`✅ Fetched ${products?.length || 0} products from database\n`)

  const baseUrl = 'https://tiscomarket.store'
  const currentDate = new Date().toISOString().split('T')[0] // Format: YYYY-MM-DD

  // Build XML sitemap
  let sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">
  
  <!-- 
    ============================================================================
    TISCO MARKET SITEMAP - Auto-generated from Database
    Generated: ${new Date().toISOString()}
    Categories: ${categories?.length || 0}
    Products: ${products?.length || 0}
    ============================================================================
  -->
  
  <!-- Homepage with high-quality favicon -->
  <url>
    <loc>${baseUrl}/</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
    <image:image>
      <image:loc>${baseUrl}/favicon-512x512.png</image:loc>
      <image:title>TISCO Market - Tanzania's Online Marketplace</image:title>
      <image:caption>Quality electronics, gadgets, rare finds, and tech services across Tanzania and East Africa</image:caption>
    </image:image>
  </url>
  
  <!-- Products catalog -->
  <url>
    <loc>${baseUrl}/products</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
    <image:image>
      <image:loc>${baseUrl}/favicon-512x512.png</image:loc>
      <image:title>Shop Products - TISCO Market</image:title>
    </image:image>
  </url>
`

  // Add category pages with descriptions
  if (categories && categories.length > 0) {
    sitemap += `\n  <!-- Category Pages with Descriptions from Database -->\n`
    
    categories.forEach((category) => {
      const categorySlug = category.name.toLowerCase().replace(/\s+/g, '-').replace(/&/g, 'and')
      const description = category.description 
        ? category.description.substring(0, 150) // Limit to 150 chars
        : `Shop ${category.name} products at TISCO Market`

      sitemap += `  <url>
    <loc>${baseUrl}/products?category=${encodeURIComponent(categorySlug)}</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.85</priority>
    <image:image>
      <image:loc>${baseUrl}/favicon-512x512.png</image:loc>
      <image:title>${category.name} - TISCO Market</image:title>
      <image:caption>${description}</image:caption>
    </image:image>
  </url>
`
    })
  }

  // Add individual product pages
  if (products && products.length > 0) {
    sitemap += `\n  <!-- Top ${products.length} Products -->\n`
    
    products.forEach((product) => {
      const priority = product.is_featured ? 0.8 : 0.7
      sitemap += `  <url>
    <loc>${baseUrl}/products/${product.id}</loc>
    <lastmod>${product.updated_at ? product.updated_at.split('T')[0] : currentDate}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>${priority}</priority>
  </url>
`
    })
  }

  // Add remaining static pages
  sitemap += `
  <!-- Services -->
  <url>
    <loc>${baseUrl}/services</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
    <image:image>
      <image:loc>${baseUrl}/favicon-512x512.png</image:loc>
      <image:title>Tech Services - TISCO Market</image:title>
      <image:caption>Custom PC building, office setup, device repair, and professional tech services in Tanzania</image:caption>
    </image:image>
  </url>
  
  <!-- Search -->
  <url>
    <loc>${baseUrl}/search</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
  
  <!-- Deals -->
  <url>
    <loc>${baseUrl}/deals</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.7</priority>
  </url>
  
  <!-- About -->
  <url>
    <loc>${baseUrl}/about</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>
  
  <!-- Contact -->
  <url>
    <loc>${baseUrl}/contact</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>
  
  <!-- Cart -->
  <url>
    <loc>${baseUrl}/cart</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.5</priority>
  </url>
  
  <!-- FAQ -->
  <url>
    <loc>${baseUrl}/faq</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.5</priority>
  </url>
  
  <!-- Legal pages -->
  <url>
    <loc>${baseUrl}/privacy</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>yearly</changefreq>
    <priority>0.3</priority>
  </url>
  
  <url>
    <loc>${baseUrl}/terms</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>yearly</changefreq>
    <priority>0.3</priority>
  </url>
  
  <url>
    <loc>${baseUrl}/cookies</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>yearly</changefreq>
    <priority>0.3</priority>
  </url>
  
  <url>
    <loc>${baseUrl}/delivery-guide</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.4</priority>
  </url>
  
</urlset>
`

  // Write to public/sitemap-static.xml (backup/reference)
  const publicDir = path.join(process.cwd(), 'public')
  const sitemapPath = path.join(publicDir, 'sitemap-static.xml')
  
  fs.writeFileSync(sitemapPath, sitemap, 'utf-8')
  
  console.log(`✅ Static sitemap generated successfully!`)
  console.log(`📍 Location: ${sitemapPath}`)
  console.log(`\n📊 Sitemap Statistics:`)
  console.log(`   - Total URLs: ${(sitemap.match(/<url>/g) || []).length}`)
  console.log(`   - Categories: ${categories?.length || 0}`)
  console.log(`   - Products: ${products?.length || 0}`)
  console.log(`   - Static Pages: 13`)
  console.log(`\n💡 Note: Next.js will auto-generate sitemap.xml from app/sitemap.ts at build time.`)
  console.log(`   This static file serves as a backup with rich metadata.\n`)
}

// Run the generator
generateStaticSitemap().catch((error) => {
  console.error('❌ Fatal error generating sitemap:', error)
  process.exit(1)
})
