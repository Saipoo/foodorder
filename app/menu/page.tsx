"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Plus, Minus, ShoppingCart } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/lib/auth-provider"
import type { MenuItem, CartItem } from "@/lib/types"

export default function MenuPage() {
  const router = useRouter()
  const { toast } = useToast()
  const { user } = useAuth()
  const [menuItems, setMenuItems] = useState<MenuItem[]>([])
  const [categories, setCategories] = useState<string[]>([])
  const [cart, setCart] = useState<CartItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")

  useEffect(() => {
    async function fetchMenu() {
      try {
        const response = await fetch("/api/menu")
        if (!response.ok) throw new Error("Failed to fetch menu")

        const data = await response.json()
        setMenuItems(data.menuItems)

        // Extract unique categories
        const uniqueCategories = Array.from(new Set(data.menuItems.map((item: MenuItem) => item.category)))
        setCategories(uniqueCategories)
      } catch (error) {
        console.error("Error fetching menu:", error)
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load menu. Please try again.",
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchMenu()
  }, [toast])

  // Load cart from localStorage
  useEffect(() => {
    const savedCart = localStorage.getItem("cart")
    if (savedCart) {
      try {
        setCart(JSON.parse(savedCart))
      } catch (e) {
        console.error("Error parsing cart from localStorage:", e)
      }
    }
  }, [])

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem("cart", JSON.stringify(cart))
  }, [cart])

  const addToCart = (item: MenuItem) => {
    setCart((prevCart) => {
      const existingItem = prevCart.find((cartItem) => cartItem._id === item._id)

      if (existingItem) {
        return prevCart.map((cartItem) =>
          cartItem._id === item._id ? { ...cartItem, quantity: cartItem.quantity + 1 } : cartItem,
        )
      } else {
        return [...prevCart, { ...item, quantity: 1 }]
      }
    })

    toast({
      title: "Added to cart",
      description: `${item.name} has been added to your cart.`,
    })
  }

  const removeFromCart = (itemId: string) => {
    setCart((prevCart) => {
      const existingItem = prevCart.find((cartItem) => cartItem._id === itemId)

      if (existingItem && existingItem.quantity > 1) {
        return prevCart.map((cartItem) =>
          cartItem._id === itemId ? { ...cartItem, quantity: cartItem.quantity - 1 } : cartItem,
        )
      } else {
        return prevCart.filter((cartItem) => cartItem._id !== itemId)
      }
    })
  }

  const getCartTotal = () => {
    return cart.reduce((total, item) => total + item.price * item.quantity, 0)
  }

  const getItemQuantity = (itemId: string) => {
    const item = cart.find((cartItem) => cartItem._id === itemId)
    return item ? item.quantity : 0
  }

  const handleCheckout = () => {
    if (!user) {
      toast({
        title: "Login required",
        description: "Please login to proceed with your order.",
        variant: "destructive",
      })
      router.push("/login")
      return
    }

    if (cart.length === 0) {
      toast({
        title: "Empty cart",
        description: "Please add items to your cart before checkout.",
        variant: "destructive",
      })
      return
    }

    router.push("/checkout")
  }

  const filteredMenuItems = menuItems.filter(
    (item) =>
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  if (isLoading) {
    return (
      <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    )
  }

  return (
    <div className="container py-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Menu</h1>
          <p className="text-muted-foreground">Browse and order from our delicious menu</p>
        </div>
        <div className="flex items-center gap-4">
          <Input
            placeholder="Search menu..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full md:w-auto"
          />
          <Button variant="outline" className="flex items-center gap-2" onClick={() => router.push("/cart")}>
            <ShoppingCart className="h-4 w-4" />
            <span>Cart ({cart.length})</span>
          </Button>
        </div>
      </div>

      <Tabs defaultValue={categories.length > 0 ? categories[0] : "all"} className="w-full">
        <TabsList className="mb-4 flex flex-wrap h-auto">
          <TabsTrigger value="all">All</TabsTrigger>
          {categories.map((category) => (
            <TabsTrigger key={category} value={category}>
              {category}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          {filteredMenuItems.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredMenuItems.map((item) => (
                <Card key={item._id}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <CardTitle>{item.name}</CardTitle>
                      <Badge variant="outline">{item.category}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground mb-4">{item.description}</p>
                    <p className="font-bold text-lg">₹{item.price.toFixed(2)}</p>
                  </CardContent>
                  <CardFooter className="flex justify-between">
                    {getItemQuantity(item._id) > 0 ? (
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="icon" onClick={() => removeFromCart(item._id)}>
                          <Minus className="h-4 w-4" />
                        </Button>
                        <span>{getItemQuantity(item._id)}</span>
                        <Button variant="outline" size="icon" onClick={() => addToCart(item)}>
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <Button onClick={() => addToCart(item)}>Add to Cart</Button>
                    )}
                  </CardFooter>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No menu items found</p>
            </div>
          )}
        </TabsContent>

        {categories.map((category) => (
          <TabsContent key={category} value={category} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredMenuItems
                .filter((item) => item.category === category)
                .map((item) => (
                  <Card key={item._id}>
                    <CardHeader>
                      <CardTitle>{item.name}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-muted-foreground mb-4">{item.description}</p>
                      <p className="font-bold text-lg">₹{item.price.toFixed(2)}</p>
                    </CardContent>
                    <CardFooter className="flex justify-between">
                      {getItemQuantity(item._id) > 0 ? (
                        <div className="flex items-center gap-2">
                          <Button variant="outline" size="icon" onClick={() => removeFromCart(item._id)}>
                            <Minus className="h-4 w-4" />
                          </Button>
                          <span>{getItemQuantity(item._id)}</span>
                          <Button variant="outline" size="icon" onClick={() => addToCart(item)}>
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                      ) : (
                        <Button onClick={() => addToCart(item)}>Add to Cart</Button>
                      )}
                    </CardFooter>
                  </Card>
                ))}
            </div>
          </TabsContent>
        ))}
      </Tabs>

      {cart.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-background border-t p-4 shadow-lg">
          <div className="container flex flex-col sm:flex-row justify-between items-center gap-4">
            <div>
              <p className="font-medium">{cart.reduce((total, item) => total + item.quantity, 0)} items in cart</p>
              <p className="text-xl font-bold">₹{getCartTotal().toFixed(2)}</p>
            </div>
            <div className="flex gap-2 w-full sm:w-auto">
              <Button variant="outline" className="flex-1 sm:flex-initial" onClick={() => router.push("/cart")}>
                View Cart
              </Button>
              <Button className="flex-1 sm:flex-initial" onClick={handleCheckout}>
                Checkout
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

