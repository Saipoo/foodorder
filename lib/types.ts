export interface User {
  _id: string
  name: string
  email: string
  role: string
}

export interface Admin {
  _id: string
  name: string
  email: string
}

export interface MenuItem {
  _id: string
  name: string
  description: string
  price: number
  category: string
  available: boolean
}

export interface CartItem extends MenuItem {
  quantity: number
}

export interface Order {
  _id: string
  orderNumber: string
  user: {
    _id: string
    name: string
    email: string
  }
  items: {
    _id: string
    name: string
    price: number
    quantity: number
  }[]
  total: number
  status: string
  paymentMethod: string
  paymentDetails?: {
    upiId?: string
    screenshot?: string
  }
  estimatedTime?: number
  createdAt: string
  updatedAt: string
}

