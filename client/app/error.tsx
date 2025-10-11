/**
 * ============================================================================
 * ERROR PAGE - What Customers See When Something Breaks
 * ============================================================================
 * 
 * WHAT IS THIS FILE?
 * This is a special "safety net" page that catches errors anywhere in the app.
 * Think of it like an airbag in a car - it only activates when something crashes.
 * 
 * WHEN DOES THIS SHOW?
 * - User tries to load a product that doesn't exist
 * - Database connection fails
 * - Code has a bug that causes a crash
 * - Network request fails unexpectedly
 * 
 * CONNECTED FILES:
 * - layout.tsx (parent wrapper for all pages)
 * - All page components (this catches their errors)
 * - /components/ui/button.tsx (UI component for buttons)
 * 
 * HOW IT WORKS:
 * Next.js automatically shows this page when any error happens in the app.
 * It's like a friendly "Oops!" message instead of a scary blank screen.
 * ============================================================================
 */

// 'use client' means this runs in the browser (not on the server)
// We need this because we're using interactive features like buttons and effects
'use client'

// Import React's useEffect - lets us run code when the component loads
import { useEffect } from 'react'
// Import our custom Button component for nice-looking, clickable buttons
import { Button } from '@/components/ui/button'

/**
 * ERROR COMPONENT
 * 
 * This is the main function that creates the error page.
 * 
 * PARAMETERS (what it receives):
 * @param error - Information about what went wrong (like a crash report)
 * @param reset - A function to try loading the page again (like hitting refresh)
 */
export default function Error({
  error,      // Details about the error that occurred
  reset,      // Function to try again (recovery mechanism)
}: {
  error: Error & { digest?: string }  // TypeScript type: error must be an Error object with optional digest ID
  reset: () => void                    // TypeScript type: reset is a function that returns nothing
}) {
  // useEffect runs code when the component first appears on screen
  // Think of it like an "onLoad" event - happens automatically when page shows
  useEffect(() => {
    // Log the error to the browser console so developers can see what happened
    // This is like writing in a logbook - helps us debug issues later
    console.error('Application error:', error)
  }, [error])  // The [error] means "run this again if error changes"

  // RETURN: The HTML/JSX that creates the visual error page
  return (
    // Outer container: Full screen height, centered content, light gray background
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      
      {/* Error message card: White box with shadow, limited width, padding */}
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-6 text-center">
        
        {/* Top section: Error message heading and description */}
        <div className="mb-4">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Something went wrong!
          </h2>
          <p className="text-gray-600">
            We encountered an unexpected error. Please try again.
          </p>
        </div>
        
        {/* Show error ID if it exists (helps support team track the issue) */}
        {/* The {error.digest && ...} means "only show this if digest exists" */}
        {error.digest && (
          <div className="mb-4 p-3 bg-gray-100 rounded text-sm text-gray-700">
            Error ID: {error.digest}
          </div>
        )}
        
        {/* Action buttons: Give user options to recover */}
        <div className="space-y-3">
          
          {/* "Try Again" button - attempts to reload the failed component */}
          <Button 
            onClick={reset}  // When clicked, call the reset function (like hitting refresh)
            className="w-full"
          >
            Try again
          </Button>
          
          {/* "Go to Homepage" button - takes user back to safety */}
          <Button 
            variant="outline"  // Different style: outlined instead of filled
            onClick={() => window.location.href = '/'}  // Navigate to homepage (/)
            className="w-full"
          >
            Go to homepage
          </Button>
        </div>
      </div>
    </div>
  )
}
