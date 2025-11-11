"use client"

import Script from 'next/script'

/**
 * GOOGLE ANALYTICS COMPONENT
 * 
 * Tracking ID: G-WT70H8RTHW
 * 
 * WHAT IS GOOGLE ANALYTICS?
 * Google Analytics (GA4) is a FREE analytics service that tracks and reports website traffic.
 * It tells you WHO visits your site, WHAT they do, and HOW they interact with your products.
 * 
 * WHY DO WE NEED IT FOR TISCO?
 * For an e-commerce platform like TISCO, GA4 provides critical business intelligence:
 * 
 * 1. CUSTOMER BEHAVIOR INSIGHTS
 *    - Which products get most views
 *    - Where customers drop off (abandon cart, exit checkout)
 *    - How long people browse before buying
 *    - Which pages convert best
 * 
 * 2. TRAFFIC SOURCES
 *    - Where customers find you (Google search, social media, direct, referrals)
 *    - Which marketing channels work best
 *    - ROI on advertising campaigns
 *    - Organic vs paid traffic performance
 * 
 * 3. E-COMMERCE TRACKING
 *    - Product views, add-to-cart events
 *    - Purchase conversions and revenue
 *    - Shopping behavior flow
 *    - Cart abandonment rates
 * 
 * 4. AUDIENCE DEMOGRAPHICS
 *    - Geographic location (which cities/regions buy most)
 *    - Device usage (mobile vs desktop)
 *    - Browser and OS data
 *    - New vs returning visitors
 * 
 * 5. REAL-TIME DATA
 *    - See current active users
 *    - Monitor live sales and events
 *    - Track campaign performance instantly
 * 
 * HOW IT WORKS:
 * 
 * Step 1: Measurement ID (G-WT70H8RTHW)
 *         - Unique identifier for your TISCO property
 *         - Links all data to your Analytics account
 * 
 * Step 2: gtag.js Script
 *         - Loads asynchronously (doesn't slow down page)
 *         - Runs in browser to collect data
 * 
 * Step 3: Data Layer
 *         - window.dataLayer = temporary storage for events
 *         - Queues tracking data before sending
 * 
 * Step 4: Data Collection
 *         - Page views, clicks, scrolls, form submissions
 *         - E-commerce events (view_item, add_to_cart, purchase)
 *         - Custom events you define
 * 
 * Step 5: Data Processing
 *         - Google servers process and aggregate data
 *         - Creates reports and insights
 *         - Available in GA4 dashboard within 24-48 hours
 * 
 * PRIVACY & GDPR COMPLIANCE:
 * - Analytics uses cookies to identify users
 * - Anonymizes IP addresses by default
 * - Users can opt-out via browser settings
 * - TISCO should add cookie consent banner (future enhancement)
 * 
 * KEY METRICS YOU'LL SEE:
 * - Users: Total unique visitors
 * - Sessions: Individual visits to site
 * - Bounce Rate: % who leave after one page
 * - Conversion Rate: % who complete purchase
 * - Average Order Value: Revenue per transaction
 * - Revenue: Total sales tracked
 * 
 * INTEGRATION BENEFITS FOR TISCO:
 * ✅ Track which products are popular
 * ✅ Optimize marketing spend (know what works)
 * ✅ Improve user experience (fix problem areas)
 * ✅ Forecast inventory needs
 * ✅ Understand customer journey
 * ✅ Measure business growth over time
 * 
 * NEXT STEPS TO MAXIMIZE VALUE:
 * 1. Set up E-commerce tracking (purchase events)
 * 2. Create conversion goals (newsletter signups, purchases)
 * 3. Link to Google Ads for campaign tracking
 * 4. Set up custom events for ZenoPay payments
 * 5. Create dashboards for key business metrics
 */

export function GoogleAnalytics() {
  return (
    <>
      {/* Load Google Analytics script asynchronously */}
      {/* Next.js Script component optimizes loading for performance */}
      <Script
        strategy="afterInteractive" // Load after page becomes interactive (non-blocking)
        src="https://www.googletagmanager.com/gtag/js?id=G-WT70H8RTHW"
      />
      
      {/* Initialize Google Analytics */}
      <Script
        id="google-analytics"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-WT70H8RTHW', {
              page_path: window.location.pathname,
              // Enable enhanced e-commerce tracking
              send_page_view: true
            });
          `,
        }}
      />
    </>
  )
}
