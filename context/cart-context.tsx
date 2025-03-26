"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"

export interface CartItem {
  _id: string
  name: string
  price: number
  quantity: number
}

interface CartContextType {
  items: CartItem[]
  addToCart: (item: CartItem) => void
  removeFromCart: (itemId: string) => void
  updateQuantity: (itemId: string, quantity: number) => void
  clearCart: () => void
  getItemQuantity: (itemId: string) => number
  getTotalItems: () => number
  getTotalPrice: () => number
}

const CartContext = createContext<CartContextType | undefined>(undefined)

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([])

  // Load cart from localStorage on initial render
  useEffect(() => {
    const savedCart = localStorage.getItem("cart")
    if (savedCart) {
      try {
        setItems(JSON.parse(savedCart))
      } catch (error) {
        console.error("Error parsing cart from localStorage:", error)
      }
    }
  }, [])

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem("cart", JSON.stringify(items))
  }, [items])

  const addToCart = (item: CartItem) => {
    setItems((prevItems) => {
      const existingItem = prevItems.find((i) => i._id === item._id)

      if (existingItem) {
        // If item already exists, update quantity
        return prevItems.map((i) => (i._id === item._id ? { ...i, quantity: i.quantity + item.quantity } : i))
      } else {
        // If item doesn't exist, add it
        return [...prevItems, item]
      }
    })
  }

  const removeFromCart = (itemId: string) => {
    setItems((prevItems) => {
      const existingItem = prevItems.find((i) => i._id === itemId)

      if (existingItem && existingItem.quantity > 1) {
        // If quantity > 1, decrease quantity
        return prevItems.map((i) => (i._id === itemId ? { ...i, quantity: i.quantity - 1 } : i))
      } else {
        // If quantity is 1, remove item
        return prevItems.filter((i) => i._id !== itemId)
      }
    })
  }

  const updateQuantity = (itemId: string, quantity: number) => {
    if (quantity <= 0) {
      // If quantity is 0 or negative, remove item
      setItems((prevItems) => prevItems.filter((i) => i._id !== itemId))
    } else {
      // Otherwise, update quantity
      setItems((prevItems) => prevItems.map((i) => (i._id === itemId ? { ...i, quantity } : i)))
    }
  }

  const clearCart = () => {
    setItems([])
  }

  const getItemQuantity = (itemId: string) => {
    const item = items.find((i) => i._id === itemId)
    return item ? item.quantity : 0
  }

  const getTotalItems = () => {
    return items.reduce((total, item) => total + item.quantity, 0)
  }

  const getTotalPrice = () => {
    return items.reduce((total, item) => total + item.price * item.quantity, 0)
  }

  return (
    <CartContext.Provider
      value={{
        items,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        getItemQuantity,
        getTotalItems,
        getTotalPrice,
      }}
    >
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const context = useContext(CartContext)
  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider")
  }
  return context
}

