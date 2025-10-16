/**
 * Structured Data Component for Rich Search Results
 * Implements Schema.org markup for Google sitelinks and rich snippets
 * Similar to Amazon, eBay, NidaDanish search result structures
 */

export function OrganizationSchema() {
  const schema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "TISCO Market",
    "alternateName": "TISCOマーケット",
    "url": "https://tiscomarket.store",
    "logo": "https://tiscomarket.store/logo-email.png",
    "description": "Tanzania's leading online marketplace for quality electronics, gadgets, rare finds, and professional tech services.",
    "address": {
      "@type": "PostalAddress",
      "addressLocality": "Dar es Salaam",
      "addressRegion": "Dar es Salaam",
      "addressCountry": "TZ"
    },
    "contactPoint": {
      "@type": "ContactPoint",
      "telephone": "+255-755-050-412",
      "contactType": "Customer Service",
      "areaServed": ["TZ", "KE", "UG"],
      "availableLanguage": ["English", "Swahili"]
    },
    "sameAs": [
      "https://www.facebook.com/tiscomarket",
      "https://twitter.com/tiscomarket",
      "https://www.instagram.com/tiscomarket"
    ]
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  )
}

export function WebsiteSchema() {
  const schema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "TISCO Market",
    "alternateName": "TISCOマーケット",
    "url": "https://tiscomarket.store",
    "potentialAction": {
      "@type": "SearchAction",
      "target": {
        "@type": "EntryPoint",
        "urlTemplate": "https://tiscomarket.store/search?q={search_term_string}"
      },
      "query-input": "required name=search_term_string"
    }
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  )
}

export function SiteNavigationSchema() {
  const schema = {
    "@context": "https://schema.org",
    "@type": "SiteNavigationElement",
    "name": "Main Navigation",
    "about": [
      {
        "@type": "ItemList",
        "name": "Product Categories",
        "itemListElement": [
          {
            "@type": "SiteNavigationElement",
            "position": 1,
            "name": "Electronics",
            "description": "Stay ahead of the curve with our collection of cutting-edge electronics and smart gadgets. From the latest smartphones and accessories to home tech, audio gear, and innovative devices",
            "url": "https://tiscomarket.store/products?category=electronics"
          },
          {
            "@type": "SiteNavigationElement",
            "position": 2,
            "name": "Anime Merch",
            "description": "Explore a wide range of anime-inspired merchandise including figures, apparel, posters, and collectibles",
            "url": "https://tiscomarket.store/products?category=anime-merch"
          },
          {
            "@type": "SiteNavigationElement",
            "position": 3,
            "name": "Rare Finds",
            "description": "A curated collection of unique, hard-to-find pieces you won't see everywhere perfect for collectors, trendsetters, and those who want something truly special",
            "url": "https://tiscomarket.store/products?category=rare-finds"
          },
          {
            "@type": "SiteNavigationElement",
            "position": 4,
            "name": "Sports",
            "description": "Gear up for performance with our wide range of sportswear, fitness gear, and athletic equipment",
            "url": "https://tiscomarket.store/products?category=sports"
          },
          {
            "@type": "SiteNavigationElement",
            "position": 5,
            "name": "Home & Garden",
            "description": "Transform your living spaces with our curated selection of home décor, furniture, and garden essentials",
            "url": "https://tiscomarket.store/products?category=home-garden"
          },
          {
            "@type": "SiteNavigationElement",
            "position": 6,
            "name": "Clothing",
            "description": "Discover our curated selection of apparel designed for comfort, style, and self-expression",
            "url": "https://tiscomarket.store/products?category=clothing"
          },
          {
            "@type": "SiteNavigationElement",
            "position": 7,
            "name": "Books",
            "description": "Explore our diverse collection of books spanning every genre and interest. From timeless literary classics and bestselling novels to insightful non-fiction",
            "url": "https://tiscomarket.store/products?category=books"
          }
        ]
      },
      {
        "@type": "ItemList",
        "name": "Customer Services",
        "itemListElement": [
          {
            "@type": "SiteNavigationElement",
            "position": 1,
            "name": "Contact Us",
            "description": "+255 755050412 Mon-Fri 9a.m.-6p.m. Email info@tiscomarket.store",
            "url": "https://tiscomarket.store/contact"
          },
          {
            "@type": "SiteNavigationElement",
            "position": 2,
            "name": "Delivery Guide",
            "description": "Fast delivery across Tanzania and East Africa",
            "url": "https://tiscomarket.store/delivery-guide"
          },
          {
            "@type": "SiteNavigationElement",
            "position": 3,
            "name": "FAQ",
            "description": "Frequently asked questions and support",
            "url": "https://tiscomarket.store/faq"
          },
          {
            "@type": "SiteNavigationElement",
            "position": 4,
            "name": "Track Order",
            "description": "Track your order status and delivery",
            "url": "https://tiscomarket.store/account/orders"
          }
        ]
      }
    ]
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  )
}

export function BreadcrumbSchema({ items }: { items: Array<{ name: string; url: string }> }) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": items.map((item, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "name": item.name,
      "item": item.url
    }))
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  )
}

export function LocalBusinessSchema() {
  const schema = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "name": "TISCO Market",
    "image": "https://tiscomarket.store/logo-email.png",
    "@id": "https://tiscomarket.store",
    "url": "https://tiscomarket.store",
    "telephone": "+255755050412",
    "priceRange": "TZS",
    "address": {
      "@type": "PostalAddress",
      "streetAddress": "Dar es Salaam",
      "addressLocality": "Dar es Salaam",
      "addressRegion": "Dar es Salaam",
      "postalCode": "12345",
      "addressCountry": "TZ"
    },
    "geo": {
      "@type": "GeoCoordinates",
      "latitude": -6.792354,
      "longitude": 39.208328
    },
    "openingHoursSpecification": {
      "@type": "OpeningHoursSpecification",
      "dayOfWeek": [
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday"
      ],
      "opens": "09:00",
      "closes": "18:00"
    },
    "sameAs": [
      "https://www.facebook.com/tiscomarket",
      "https://twitter.com/tiscomarket",
      "https://www.instagram.com/tiscomarket"
    ]
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  )
}

export function ProductSchema({ product }: {
  product: {
    name: string
    description: string
    image: string
    price: number
    currency: string
    availability: string
    sku?: string
    brand?: string
  }
}) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "Product",
    "name": product.name,
    "image": product.image,
    "description": product.description,
    "sku": product.sku || product.name.replace(/\s+/g, '-').toLowerCase(),
    "brand": {
      "@type": "Brand",
      "name": product.brand || "TISCO Market"
    },
    "offers": {
      "@type": "Offer",
      "url": `https://tiscomarket.store/products/${product.sku}`,
      "priceCurrency": product.currency,
      "price": product.price,
      "priceValidUntil": new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      "itemCondition": "https://schema.org/NewCondition",
      "availability": `https://schema.org/${product.availability}`,
      "seller": {
        "@type": "Organization",
        "name": "TISCO Market"
      }
    }
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  )
}

export function FAQSchema({ faqs }: { faqs: Array<{ question: string; answer: string }> }) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": faqs.map(faq => ({
      "@type": "Question",
      "name": faq.question,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": faq.answer
      }
    }))
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  )
}
