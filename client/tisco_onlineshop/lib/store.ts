import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface CartItem {
  id: string
  productId: string
  name: string
  price: number
  quantity: number
  image_url: string
}

interface CartStore {
  items: CartItem[]
  isOpen: boolean
  addItem: (product: {
    id: string
    name: string
    price: number
    image_url: string
  }, quantity?: number) => void
  removeItem: (productId: string) => void
  updateQuantity: (productId: string, quantity: number) => void
  clearCart: () => void
  getTotalItems: () => number
  getTotalPrice: () => number
  openCart: () => void
  closeCart: () => void
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,

      addItem: (product, quantity = 1) => {
        const items = get().items
        const existingItem = items.find(item => item.productId === product.id)

        if (existingItem) {
          // Update quantity if item already exists
          set({
            items: items.map(item =>
              item.productId === product.id
                ? { ...item, quantity: item.quantity + quantity }
                : item
            )
          })
        } else {
          // Add new item
          const newItem: CartItem = {
            id: `cart-${Date.now()}-${product.id}`,
            productId: product.id,
            name: product.name,
            price: product.price,
            quantity,
            image_url: product.image_url
          }
          set({ items: [...items, newItem] })
        }
      },

      removeItem: (productId) => {
        set({
          items: get().items.filter(item => item.productId !== productId)
        })
      },

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

      clearCart: () => {
        set({ items: [] })
      },

      getTotalItems: () => {
        return get().items.reduce((total, item) => total + item.quantity, 0)
      },

      getTotalPrice: () => {
        return get().items.reduce((total, item) => total + (item.price * item.quantity), 0)
      },

      openCart: () => {
        set({ isOpen: true })
      },

      closeCart: () => {
        set({ isOpen: false })
      }
    }),
    {
      name: 'tisco-cart-storage',
      partialize: (state) => ({ items: state.items })
    }
  )
)
