"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ShoppingBag, Clock, CheckCircle } from "lucide-react"
import Link from "next/link"
import { useAuth } from "@/lib/auth-provider"
import type { Order } from "@/lib/types"

export default function DashboardPage() {
  const { user } = useAuth()
  const [activeOrders, setActiveOrders] = useState<Order[]>([])
  const [pastOrders, setPastOrders] = useState<Order[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function fetchOrders() {
      if (!user) return

      try {
        const response = await fetch("/api/orders/user")
        if (!response.ok) throw new Error("Failed to fetch orders")

        const data = await response.json()

        setActiveOrders(
          data.orders.filter((order: Order) => order.status !== "completed" && order.status !== "cancelled"),
        )

        setPastOrders(
          data.orders.filter((order: Order) => order.status === "completed" || order.status === "cancelled"),
        )
      } catch (error) {
        console.error("Error fetching orders:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchOrders()
  }, [user])

  if (isLoading) {
    return (
      <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
        <p className="text-muted-foreground">Welcome back, {user?.name}! Here's an overview of your orders.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Orders</CardTitle>
            <ShoppingBag className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeOrders.length}</div>
            <p className="text-xs text-muted-foreground">Orders currently being processed</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Past Orders</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pastOrders.length}</div>
            <p className="text-xs text-muted-foreground">Completed or cancelled orders</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Quick Actions</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <Link href="/menu">
              <Button className="w-full">Order Food</Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        <h3 className="text-xl font-bold">Active Orders</h3>
        {activeOrders.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {activeOrders.map((order) => (
              <Card key={order._id}>
                <CardHeader>
                  <CardTitle>Order #{order.orderNumber}</CardTitle>
                  <CardDescription>Placed on {new Date(order.createdAt).toLocaleDateString()}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between">
                    <span>Status:</span>
                    <span className="font-medium capitalize">{order.status}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total:</span>
                    <span className="font-medium">₹{order.total.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Items:</span>
                    <span className="font-medium">{order.items.length}</span>
                  </div>
                  <Link href={`/orders/${order._id}`}>
                    <Button variant="outline" className="w-full mt-2">
                      View Details
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="py-6 text-center">
              <p className="text-muted-foreground">No active orders</p>
              <Link href="/menu">
                <Button className="mt-4">Order Food</Button>
              </Link>
            </CardContent>
          </Card>
        )}
      </div>

      <div className="space-y-4">
        <h3 className="text-xl font-bold">Order History</h3>
        {pastOrders.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {pastOrders.slice(0, 3).map((order) => (
              <Card key={order._id}>
                <CardHeader>
                  <CardTitle>Order #{order.orderNumber}</CardTitle>
                  <CardDescription>Placed on {new Date(order.createdAt).toLocaleDateString()}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between">
                    <span>Status:</span>
                    <span className="font-medium capitalize">{order.status}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total:</span>
                    <span className="font-medium">₹{order.total.toFixed(2)}</span>
                  </div>
                  <Link href={`/orders/${order._id}`}>
                    <Button variant="outline" className="w-full mt-2">
                      View Details
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="py-6 text-center">
              <p className="text-muted-foreground">No order history</p>
            </CardContent>
          </Card>
        )}
        {pastOrders.length > 3 && (
          <div className="flex justify-center">
            <Link href="/orders/history">
              <Button variant="outline">View All Orders</Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}

