import { getProducts, getCategories } from '@/lib/database'

export async function GET() {
  const baseUrl = 'https://tiscomarket.store'
  
  // Get dynamic data
  const [products, categories] = await Promise.all([
    getProducts(1000), // Get up to 1000 products for sitemap
    getCategories()
  ])

  // Static pages
  const staticPages = [
    '',
    '/about',
    '/products',
    '/services',
    '/contact',
    '/deals',
    '/faq',
    '/delivery-guide',
    '/track-order',
    '/privacy',
    '/terms',
    '/cookies'
  ]

  // Generate XML
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
  ${staticPages.map(page => `
  <url>
    <loc>${baseUrl}${page}</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>${page === '' ? 'daily' : page === '/products' ? 'daily' : 'weekly'}</changefreq>
    <priority>${page === '' ? '1.0' : page === '/products' || page === '/services' ? '0.9' : '0.8'}</priority>
  </url>`).join('')}
  
  ${categories?.map(category => `
  <url>
    <loc>${baseUrl}/products?category=${category.id}</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
  </url>`).join('') || ''}
  
  <!-- Niche Product Search URLs for Tanzania SEO -->
  <url>
    <loc>${baseUrl}/products?query=antiques</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>
  
  <url>
    <loc>${baseUrl}/products?query=anime+merchandise</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.7</priority>
  </url>
  
  <url>
    <loc>${baseUrl}/products?query=collectibles</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>
  
  <url>
    <loc>${baseUrl}/products?query=figurines</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>
  
  <url>
    <loc>${baseUrl}/products?query=manga</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>
  
  <url>
    <loc>${baseUrl}/products?query=rare+finds</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
  
  <url>
    <loc>${baseUrl}/products?query=niche+products</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.6</priority>
  </url>
  
  ${products?.map(product => `
  <url>
    <loc>${baseUrl}/product?id=${product.id}</loc>
    <lastmod>${product.updated_at ? new Date(product.updated_at).toISOString() : new Date().toISOString()}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
    ${product.image_url ? `
    <image:image>
      <image:loc>${product.image_url.startsWith('http') ? product.image_url : baseUrl + product.image_url}</image:loc>
      <image:title>${product.name}</image:title>
      <image:caption>${product.description || product.name}</image:caption>
    </image:image>` : ''}
  </url>`).join('') || ''}
</urlset>`

  return new Response(sitemap, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600' // Cache for 1 hour
    }
  })
}

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
