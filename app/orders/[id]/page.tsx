"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Clock, CheckCircle, Printer, ShoppingBag } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/lib/auth-provider"
import type { Order } from "@/lib/types"

export default function OrderDetailsPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const { toast } = useToast()
  const { user } = useAuth()
  const [order, setOrder] = useState<Order | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null)

  useEffect(() => {
    if (!user) {
      router.push("/login")
      return
    }

    async function fetchOrder() {
      try {
        const response = await fetch(`/api/orders/${params.id}`)
        if (!response.ok) throw new Error("Failed to fetch order")

        const data = await response.json()
        setOrder(data.order)

        // Calculate time remaining if order is in progress
        if (data.order.status === "preparing" || data.order.status === "placed") {
          const estimatedTime = data.order.estimatedTime || 15 // Default 15 minutes
          const orderTime = new Date(data.order.createdAt).getTime()
          const completionTime = orderTime + estimatedTime * 60 * 1000
          const remaining = Math.max(0, Math.floor((completionTime - Date.now()) / 60000))
          setTimeRemaining(remaining)
        }
      } catch (error) {
        console.error("Error fetching order:", error)
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load order details. Please try again.",
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchOrder()
  }, [user, params.id, router, toast])

  // Update time remaining every minute
  useEffect(() => {
    if (!order || timeRemaining === null) return

    const timer = setInterval(() => {
      setTimeRemaining((prev) => (prev && prev > 0 ? prev - 1 : 0))
    }, 60000)

    return () => clearInterval(timer)
  }, [order, timeRemaining])

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "placed":
        return "default"
      case "preparing":
        return "warning"
      case "ready":
        return "success"
      case "completed":
        return "success"
      case "cancelled":
        return "destructive"
      default:
        return "secondary"
    }
  }

  const handlePrintReceipt = () => {
    window.print()
  }

  const handleReorder = () => {
    if (!order) return

    try {
      // Add items to cart
      const cartItems = order.items.map((item) => ({
        ...item,
        quantity: item.quantity,
      }))

      localStorage.setItem("cart", JSON.stringify(cartItems))

      toast({
        title: "Items added to cart",
        description: "All items from this order have been added to your cart.",
      })

      router.push("/cart")
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to add items to cart. Please try again.",
      })
    }
  }

  if (isLoading) {
    return (
      <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    )
  }

  if (!order) {
    return (
      <div className="container py-6">
        <div className="flex items-center gap-2 mb-6">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-3xl font-bold tracking-tight">Order Not Found</h1>
        </div>
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground mb-4">
              The order you're looking for doesn't exist or you don't have permission to view it.
            </p>
            <Button onClick={() => router.push("/dashboard")}>Go to Dashboard</Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container py-6">
      <div className="flex items-center gap-2 mb-6">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-3xl font-bold tracking-tight">Order #{order.orderNumber}</h1>
        <Badge variant={getStatusBadgeVariant(order.status)} className="ml-2 capitalize">
          {order.status}
        </Badge>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2 space-y-6">
          <Card className="print:shadow-none">
            <CardHeader>
              <CardTitle>Order Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Order Date</p>
                  <p className="font-medium">
                    {new Date(order.createdAt).toLocaleDateString()} at {new Date(order.createdAt).toLocaleTimeString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Payment Method</p>
                  <p className="font-medium capitalize">{order.paymentMethod}</p>
                </div>
              </div>

              <Separator />

              <div>
                <h3 className="font-medium mb-2">Items</h3>
                <div className="space-y-2">
                  {order.items.map((item, index) => (
                    <div key={index} className="flex justify-between">
                      <span>
                        {item.name} x {item.quantity}
                      </span>
                      <span>₹{(item.price * item.quantity).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>₹{(order.total / 1.05).toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Taxes (5%)</span>
                  <span>₹{(order.total - order.total / 1.05).toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-bold">
                  <span>Total</span>
                  <span>₹{order.total.toFixed(2)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {(order.status === "placed" || order.status === "preparing") && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Order Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex flex-col items-center justify-center p-6 text-center">
                    <div className="mb-4 text-5xl font-bold">{timeRemaining !== null ? timeRemaining : "--"}</div>
                    <p className="text-muted-foreground">
                      {timeRemaining !== null && timeRemaining > 0
                        ? "Minutes until your order is ready"
                        : "Your order should be ready soon!"}
                    </p>
                  </div>

                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-muted" />
                    </div>
                    <div className="relative flex justify-center">
                      <div className="bg-background px-2 text-sm text-muted-foreground">Order Progress</div>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="flex flex-col items-center">
                      <div
                        className={`flex h-10 w-10 items-center justify-center rounded-full ${
                          order.status !== "cancelled"
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        1
                      </div>
                      <p className="mt-2 text-sm font-medium">Placed</p>
                    </div>
                    <div className="flex flex-col items-center">
                      <div
                        className={`flex h-10 w-10 items-center justify-center rounded-full ${
                          order.status === "preparing" || order.status === "ready" || order.status === "completed"
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        2
                      </div>
                      <p className="mt-2 text-sm font-medium">Preparing</p>
                    </div>
                    <div className="flex flex-col items-center">
                      <div
                        className={`flex h-10 w-10 items-center justify-center rounded-full ${
                          order.status === "ready" || order.status === "completed"
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        3
                      </div>
                      <p className="mt-2 text-sm font-medium">Ready</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {(order.status === "ready" || order.status === "completed") && (
            <Card className="bg-success/10 border-success/20">
              <CardContent className="p-6">
                <div className="flex flex-col items-center justify-center text-center">
                  <CheckCircle className="h-12 w-12 text-success mb-4" />
                  <h3 className="text-xl font-bold mb-2">
                    {order.status === "ready" ? "Your order is ready!" : "Order completed"}
                  </h3>
                  <p className="text-muted-foreground">
                    {order.status === "ready"
                      ? "Please collect your order from the cafeteria counter."
                      : "Thank you for your order. We hope you enjoyed your meal!"}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button variant="outline" className="w-full flex items-center gap-2" onClick={handlePrintReceipt}>
                <Printer className="h-4 w-4" />
                Print Receipt
              </Button>
              <Button className="w-full flex items-center gap-2" onClick={handleReorder}>
                <ShoppingBag className="h-4 w-4" />
                Reorder
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Need Help?</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                If you have any issues with your order, please contact the cafeteria staff.
              </p>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm">Phone:</span>
                  <span className="text-sm font-medium">+91 1234567890</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Email:</span>
                  <span className="text-sm font-medium">cafeteria@svce.edu.in</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

