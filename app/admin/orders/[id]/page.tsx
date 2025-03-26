"use client"

import { Input } from "@/components/ui/input"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, Download, Printer } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import type { Order } from "@/lib/types"

export default function AdminOrderDetailsPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const { toast } = useToast()
  const [order, setOrder] = useState<Order | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isUpdating, setIsUpdating] = useState(false)

  useEffect(() => {
    async function fetchOrder() {
      try {
        const response = await fetch(`/api/admin/orders/${params.id}`)
        if (!response.ok) throw new Error("Failed to fetch order")

        const data = await response.json()
        setOrder(data.order)
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
  }, [params.id, toast])

  const handleStatusChange = async (newStatus: string) => {
    if (!order) return

    setIsUpdating(true)
    try {
      const response = await fetch(`/api/admin/orders/${order._id}/status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: newStatus }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || "Failed to update order status")
      }

      const data = await response.json()
      setOrder(data.order)

      toast({
        title: "Status updated",
        description: `Order status has been updated to ${newStatus}.`,
      })
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Update failed",
        description: error instanceof Error ? error.message : "Something went wrong",
      })
    } finally {
      setIsUpdating(false)
    }
  }

  const handleDownloadReceipt = async () => {
    if (!order) return

    try {
      const response = await fetch(`/api/admin/orders/${order._id}/receipt`, {
        method: "GET",
      })

      if (!response.ok) throw new Error("Failed to download receipt")

      // Create a blob from the response
      const blob = await response.blob()

      // Create a link element to download the file
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `receipt-${order.orderNumber}.pdf`
      document.body.appendChild(a)
      a.click()

      // Clean up
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      toast({
        title: "Download successful",
        description: "Order receipt has been downloaded.",
      })
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Download failed",
        description: error instanceof Error ? error.message : "Something went wrong",
      })
    }
  }

  const handlePrintReceipt = () => {
    window.print()
  }

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

  if (isLoading) {
    return (
      <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    )
  }

  if (!order) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h2 className="text-3xl font-bold tracking-tight">Order Not Found</h2>
        </div>
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground mb-4">
              The order you're looking for doesn't exist or you don't have permission to view it.
            </p>
            <Button onClick={() => router.push("/admin/dashboard")}>Go to Dashboard</Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h2 className="text-3xl font-bold tracking-tight">Order #{order.orderNumber}</h2>
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

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Customer</p>
                  <p className="font-medium">{order.user.name}</p>
                  <p className="text-sm text-muted-foreground">{order.user.email}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <div className="flex items-center gap-2">
                    <Badge variant={getStatusBadgeVariant(order.status)} className="capitalize">
                      {order.status}
                    </Badge>
                    <Select defaultValue={order.status} onValueChange={handleStatusChange} disabled={isUpdating}>
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Change status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="placed">Placed</SelectItem>
                        <SelectItem value="preparing">Preparing</SelectItem>
                        <SelectItem value="ready">Ready</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
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

          {order.paymentMethod === "qr" && order.paymentDetails?.screenshot && (
            <Card>
              <CardHeader>
                <CardTitle>Payment Screenshot</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex justify-center">
                  <img
                    src={order.paymentDetails.screenshot || "/placeholder.svg"}
                    alt="Payment Screenshot"
                    className="max-h-80 rounded-md"
                  />
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
              <Button className="w-full flex items-center gap-2" onClick={handleDownloadReceipt}>
                <Download className="h-4 w-4" />
                Download Receipt
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Estimated Time</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Input type="number" min="1" defaultValue={order.estimatedTime || 15} className="w-20" />
                <span>minutes</span>
                <Button variant="outline" size="sm">
                  Update
                </Button>
              </div>
              <p className="text-sm text-muted-foreground mt-2">Set the estimated preparation time for this order.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

