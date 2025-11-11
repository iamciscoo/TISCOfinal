/**
 * GOOGLE ANALYTICS UTILITY FUNCTIONS
 * 
 * Helper functions to track e-commerce events and custom interactions
 * throughout the TISCO platform.
 * 
 * USAGE:
 * Import these functions in your components and call them when events occur.
 * Example: trackPurchase(orderData) after successful checkout
 */

// TypeScript type definitions for gtag
type GtagConfig = Record<string, string | number | boolean | undefined | object>;

declare global {
  interface Window {
    gtag?: (
      command: 'config' | 'event' | 'js' | 'set',
      targetId: string | Date,
      config?: GtagConfig
    ) => void;
    dataLayer?: Record<string, unknown>[];
  }
}

/**
 * Track page views manually (useful for SPAs)
 * Called automatically by Next.js router, but can be called manually
 */
export const trackPageView = (url: string) => {
  if (typeof window.gtag !== 'undefined') {
    window.gtag('config', 'G-WT70H8RTHW', {
      page_path: url,
    });
  }
};

/**
 * Track product views
 * Call when user views a product detail page
 * 
 * @example
 * trackProductView({
 *   id: 'PROD123',
 *   name: 'Samsung Galaxy S21',
 *   category: 'Electronics/Phones',
 *   price: 1500000,
 *   currency: 'TZS'
 * });
 */
export const trackProductView = (product: {
  id: string;
  name: string;
  category?: string;
  price?: number;
  currency?: string;
  brand?: string;
}) => {
  if (typeof window.gtag !== 'undefined') {
    window.gtag('event', 'view_item', {
      currency: product.currency || 'TZS',
      value: product.price || 0,
      items: [
        {
          item_id: product.id,
          item_name: product.name,
          item_category: product.category,
          item_brand: product.brand,
          price: product.price,
        },
      ],
    });
  }
};

/**
 * Track add to cart events
 * Call when user adds item to shopping cart
 * 
 * @example
 * trackAddToCart({
 *   id: 'PROD123',
 *   name: 'Samsung Galaxy S21',
 *   price: 1500000,
 *   quantity: 1,
 *   currency: 'TZS'
 * });
 */
export const trackAddToCart = (item: {
  id: string;
  name: string;
  price: number;
  quantity: number;
  currency?: string;
  category?: string;
}) => {
  if (typeof window.gtag !== 'undefined') {
    window.gtag('event', 'add_to_cart', {
      currency: item.currency || 'TZS',
      value: item.price * item.quantity,
      items: [
        {
          item_id: item.id,
          item_name: item.name,
          item_category: item.category,
          price: item.price,
          quantity: item.quantity,
        },
      ],
    });
  }
};

/**
 * Track remove from cart events
 * Call when user removes item from cart
 */
export const trackRemoveFromCart = (item: {
  id: string;
  name: string;
  price: number;
  quantity: number;
  currency?: string;
}) => {
  if (typeof window.gtag !== 'undefined') {
    window.gtag('event', 'remove_from_cart', {
      currency: item.currency || 'TZS',
      value: item.price * item.quantity,
      items: [
        {
          item_id: item.id,
          item_name: item.name,
          price: item.price,
          quantity: item.quantity,
        },
      ],
    });
  }
};

/**
 * Track beginning of checkout process
 * Call when user clicks "Proceed to Checkout"
 */
export const trackBeginCheckout = (cart: {
  items: Array<{
    id: string;
    name: string;
    price: number;
    quantity: number;
    category?: string;
  }>;
  totalValue: number;
  currency?: string;
}) => {
  if (typeof window.gtag !== 'undefined') {
    window.gtag('event', 'begin_checkout', {
      currency: cart.currency || 'TZS',
      value: cart.totalValue,
      items: cart.items.map((item) => ({
        item_id: item.id,
        item_name: item.name,
        item_category: item.category,
        price: item.price,
        quantity: item.quantity,
      })),
    });
  }
};

/**
 * Track successful purchases
 * Call after payment confirmation and order creation
 * 
 * CRITICAL: This is your main revenue tracking metric
 * 
 * @example
 * trackPurchase({
 *   transactionId: 'ORD-12345',
 *   value: 2500000,
 *   currency: 'TZS',
 *   tax: 0,
 *   shipping: 50000,
 *   items: [{
 *     id: 'PROD123',
 *     name: 'Samsung Galaxy S21',
 *     price: 1500000,
 *     quantity: 1,
 *     category: 'Electronics'
 *   }],
 *   paymentMethod: 'Mobile Money'
 * });
 */
export const trackPurchase = (order: {
  transactionId: string;
  value: number;
  currency?: string;
  tax?: number;
  shipping?: number;
  items: Array<{
    id: string;
    name: string;
    price: number;
    quantity: number;
    category?: string;
  }>;
  paymentMethod?: string;
}) => {
  if (typeof window.gtag !== 'undefined') {
    window.gtag('event', 'purchase', {
      transaction_id: order.transactionId,
      value: order.value,
      currency: order.currency || 'TZS',
      tax: order.tax || 0,
      shipping: order.shipping || 0,
      payment_type: order.paymentMethod,
      items: order.items.map((item) => ({
        item_id: item.id,
        item_name: item.name,
        item_category: item.category,
        price: item.price,
        quantity: item.quantity,
      })),
    });
  }
};

/**
 * Track search queries
 * Call when user searches for products
 */
export const trackSearch = (searchTerm: string, resultsCount?: number) => {
  if (typeof window.gtag !== 'undefined') {
    window.gtag('event', 'search', {
      search_term: searchTerm,
      results_count: resultsCount,
    });
  }
};

/**
 * Track custom events
 * Use for any specific business events you want to measure
 * 
 * @example
 * trackEvent('newsletter_signup', { method: 'footer_form' });
 * trackEvent('whatsapp_click', { product_id: 'PROD123' });
 * trackEvent('zenopay_initiated', { amount: 150000 });
 */
export const trackEvent = (
  eventName: string,
  eventParams?: GtagConfig
) => {
  if (typeof window.gtag !== 'undefined') {
    window.gtag('event', eventName, eventParams);
  }
};

/**
 * Track sign ups
 * Call when user creates account
 */
export const trackSignUp = (method: 'email' | 'google' | 'other') => {
  if (typeof window.gtag !== 'undefined') {
    window.gtag('event', 'sign_up', {
      method,
    });
  }
};

/**
 * Track logins
 * Call when user successfully logs in
 */
export const trackLogin = (method: 'email' | 'google' | 'other') => {
  if (typeof window.gtag !== 'undefined') {
    window.gtag('event', 'login', {
      method,
    });
  }
};

/**
 * EXAMPLE INTEGRATION POINTS FOR TISCO:
 * 
 * 1. Product Detail Page:
 *    useEffect(() => {
 *      trackProductView({
 *        id: product.id,
 *        name: product.name,
 *        price: product.price,
 *        category: product.category
 *      });
 *    }, [product]);
 * 
 * 2. Add to Cart Button:
 *    const handleAddToCart = () => {
 *      addToCart(product);
 *      trackAddToCart({
 *        id: product.id,
 *        name: product.name,
 *        price: product.price,
 *        quantity: 1
 *      });
 *    };
 * 
 * 3. Checkout Success:
 *    const handlePaymentSuccess = (order) => {
 *      trackPurchase({
 *        transactionId: order.id,
 *        value: order.total,
 *        items: order.items,
 *        paymentMethod: 'ZenoPay Mobile Money'
 *      });
 *    };
 * 
 * 4. Search Bar:
 *    const handleSearch = (query) => {
 *      const results = searchProducts(query);
 *      trackSearch(query, results.length);
 *    };
 */
