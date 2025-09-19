/**
 * Zustand store for shopping cart management
 * 
 * Features:
 * - Persistent cart state across browser sessions
 * - Server synchronization capabilities
 * - Optimistic updates for better UX
 * - Type-safe cart operations
 */

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

/**
 * Represents an item in the shopping cart
 */
export interface CartItem {
  id: string          // Unique cart item ID
  productId: string   // Product ID for database operations
  name: string        // Product name for display
  price: number       // Price at time of adding to cart
  quantity: number    // Quantity of this item
  image_url: string   // Product image URL
}

/**
 * Shopping cart store interface
 */
interface CartStore {
  // State
  items: CartItem[]                    // Array of cart items
  isOpen: boolean                      // Cart sidebar visibility
  hasHydrated: boolean                 // True when persisted state has been loaded
  setHasHydrated: (v: boolean) => void // Setter for hydration flag
  // Identify which authenticated user this persisted cart belongs to
  ownerId: string | null
  setOwnerId: (id: string | null) => void
  
  // Cart operations
  addItem: (product: {
    id: string
    name: string
    price: number
    image_url: string
  }, quantity?: number) => void
  removeItem: (productId: string) => void
  updateQuantity: (productId: string, quantity: number) => void
  clearCart: () => void
  
  // Computed values
  getTotalItems: () => number
  getTotalPrice: () => number
  
  // UI controls
  openCart: () => void
  closeCart: () => void
}

/**
 * Create the cart store with persistence
 */
export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      // Initial state
      items: [],
      isOpen: false,
      hasHydrated: false,
      ownerId: null,

      // Internal: mark store as hydrated from persistence
      setHasHydrated: (v) => set({ hasHydrated: v }),

      // Track current owner of this cart (to prevent cross-account merge)
      setOwnerId: (id) => set({ ownerId: id }),

      /**
       * Add a product to the cart or update quantity if already exists
       * @param product - Product information
       * @param quantity - Quantity to add (default: 1)
       */
      addItem: (product, quantity = 1) => {
        const { items } = get()
        const existingItem = items.find(item => item.productId === product.id)

        if (existingItem) {
          // Update quantity for existing item
          set({
            items: items.map(item =>
              item.productId === product.id
                ? { ...item, quantity: item.quantity + quantity }
                : item
            )
          })
        } else {
          // Add new item to cart
          const newItem: CartItem = {
            id: `cart-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            productId: product.id,
            name: product.name,
            price: product.price,
            quantity,
            image_url: product.image_url
          }
          set({ items: [...items, newItem] })
        }
      },

      /**
       * Remove an item completely from the cart
       * @param productId - Product ID to remove
       */
      removeItem: (productId) => {
        set({
          items: get().items.filter(item => item.productId !== productId)
        })
      },

      /**
       * Update the quantity of a specific cart item
       * @param productId - Product ID to update
       * @param quantity - New quantity (removes item if <= 0)
       */
      updateQuantity: (productId, quantity) => {
        if (quantity <= 0) {
          get().removeItem(productId)
          return
        }

        set({
          items: get().items.map(item =>
            item.productId === productId
              ? { ...item, quantity }
              : item
          )
        })
      },

      /**
       * Clear all items from the cart
       */
      clearCart: () => {
        set({ items: [] })
      },

      /**
       * Calculate total number of items in cart
       * @returns Total quantity of all items
       */
      getTotalItems: () => {
        return get().items.reduce((total, item) => total + item.quantity, 0)
      },

      /**
       * Calculate total price of all items in cart
       * @returns Total price including all quantities
       */
      getTotalPrice: () => {
        return get().items.reduce((total, item) => total + (item.price * item.quantity), 0)
      },

      /**
       * Open the cart sidebar
       */
      openCart: () => {
        set({ isOpen: true })
      },

      /**
       * Close the cart sidebar
       */
      closeCart: () => {
        set({ isOpen: false })
      }
    }),
    {
      name: 'tisco-cart-storage',
      // Only persist cart items, not UI state or server sync timestamps
      partialize: (state) => ({ items: state.items, ownerId: state.ownerId }),
      // Merge strategy for handling storage version changes
      merge: (persistedState, currentState) => ({
        ...currentState,
        ...(persistedState as object),
      }),
      // Signal when rehydration from storage has completed
      onRehydrateStorage: () => (state) => {
        try {
          state?.setHasHydrated?.(true)
        } catch {
          // no-op
        }
      },
    }
  )
)
