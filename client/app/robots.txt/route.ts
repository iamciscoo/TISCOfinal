export async function GET() {
  const robotsTxt = `User-agent: *
Allow: /

# Important SEO pages
Allow: /products
Allow: /services  
Allow: /about
Allow: /contact
Allow: /deals

# Product pages
Allow: /product

# Static assets and brand assets
Allow: /favicon.ico
Allow: /sitemap.xml
Allow: /manifest.json
Allow: /*.png
Allow: /*.jpg
Allow: /*.jpeg
Allow: /*.webp
Allow: /*.svg

# Brand and logo assets - high priority for crawling
Allow: /logo-email.png
Allow: /favicon-*.png
Allow: /favicon.svg
Allow: /favicon.ico

# Disallow admin and auth pages
Disallow: /admin
Disallow: /api/
Disallow: /auth/
Disallow: /account/
Disallow: /_next/
Disallow: /checkout/

# Crawl delay to be respectful
Crawl-delay: 1

# Sitemap location
Sitemap: https://tiscomarket.store/sitemap.xml`

  return new Response(robotsTxt, {
    headers: {
      'Content-Type': 'text/plain',
      'Cache-Control': 'public, max-age=86400' // Cache for 24 hours
    }
  })
}

export const runtime = 'nodejs'
