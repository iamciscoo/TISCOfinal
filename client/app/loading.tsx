/**
 * ============================================================================
 * LOADING PAGE - The "Please Wait" Screen
 * ============================================================================
 * 
 * WHAT IS THIS FILE?
 * This is the page customers see while data is being loaded from the server.
 * Think of it like the spinning wheel on your phone when an app is loading.
 * 
 * WHEN DOES THIS SHOW?
 * - User navigates to a new page (homepage → products page)
 * - Data is being fetched from database
 * - Images or components are being loaded
 * - Network is slow and page takes time to load
 * 
 * CONNECTED FILES:
 * - layout.tsx (parent that wraps all pages)
 * - page.tsx (homepage that might need loading time)
 * - /components/shared/LoadingSpinner.tsx (the actual spinning animation)
 * - All other pages (they all use this while loading)
 * 
 * HOW IT WORKS:
 * Next.js automatically shows this component while a page is loading.
 * Once the page is ready, it replaces this with the actual content.
 * It's like a "Loading..." message, but prettier!
 * ============================================================================
 */

// Import our custom spinner component (the spinning circle animation)
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'

/**
 * LOADING COMPONENT
 * 
 * Creates a centered loading spinner on the screen.
 * This is what users stare at while waiting for pages to load!
 */
export default function Loading() {
  return (
    // Full screen container with centered content and light gray background
    // min-h-screen = minimum height is full screen
    // flex items-center justify-center = center everything horizontally and vertically
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      {/* 
        The actual spinner component 
        size="lg" means "large" - makes it big enough to see clearly
      */}
      <LoadingSpinner size="lg" />
    </div>
  )
}
