"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Download, FileDown, ShoppingBag, Utensils, Users } from "lucide-react"
import Link from "next/link"
import { useToast } from "@/hooks/use-toast"
import type { Order } from "@/lib/types"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"

interface RevenueData {
  totalRevenue: number
  todayRevenue: number
  revenueHistory: Array<{
    date: string
    amount: number
  }>
}

export default function AdminDashboardPage() {
  const { toast } = useToast()
  const [orders, setOrders] = useState<Order[]>([])
  const [stats, setStats] = useState({
    totalOrders: 0,
    pendingOrders: 0,
    completedOrders: 0,
    totalRevenue: 0,
  })
  const [isLoading, setIsLoading] = useState(true)
  const [revenueData, setRevenueData] = useState<RevenueData | null>(null)

  useEffect(() => {
    async function fetchDashboardData() {
      try {
        // Fetch orders
        const ordersResponse = await fetch("/api/admin/orders")
        if (!ordersResponse.ok) throw new Error("Failed to fetch orders")
        const ordersData = await ordersResponse.json()

        // Fetch stats
        const statsResponse = await fetch("/api/admin/stats")
        if (!statsResponse.ok) throw new Error("Failed to fetch stats")
        const statsData = await statsResponse.json()

        setOrders(ordersData.orders)
        setStats(statsData.stats)
      } catch (error) {
        console.error("Error fetching dashboard data:", error)
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load dashboard data. Please try again.",
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchDashboardData()
  }, [toast])

  useEffect(() => {
    fetchRevenueData()
  }, [])

  const fetchRevenueData = async () => {
    try {
      const response = await fetch("/api/admin/revenue")
      if (!response.ok) throw new Error("Failed to fetch revenue data")

      const data = await response.json()
      setRevenueData(data)
    } catch (error) {
      console.error("Error fetching revenue data:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load revenue data. Please try again.",
      })
    }
  }

  const handleDownloadOrderList = async () => {
    try {
      const response = await fetch("/api/admin/orders/download", {
        method: "GET",
      })

      if (!response.ok) throw new Error("Failed to download order list")

      // Create a blob from the response
      const blob = await response.blob()

      // Create a link element to download the file
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `orders-${new Date().toISOString().split("T")[0]}.docx`
      document.body.appendChild(a)
      a.click()

      // Clean up
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      toast({
        title: "Download successful",
        description: "Order list has been downloaded.",
      })
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Download failed",
        description: error instanceof Error ? error.message : "Something went wrong",
      })
    }
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

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Admin Dashboard</h2>
        <p className="text-muted-foreground">Overview of the cafeteria operations and orders.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
            <ShoppingBag className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalOrders}</div>
            <p className="text-xs text-muted-foreground">All orders placed in the system</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Orders</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingOrders}</div>
            <p className="text-xs text-muted-foreground">Orders waiting to be processed</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed Orders</CardTitle>
            <Utensils className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.completedOrders}</div>
            <p className="text-xs text-muted-foreground">Successfully fulfilled orders</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <FileDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{stats.totalRevenue.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">Total earnings from all orders</p>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-between items-center">
        <h3 className="text-xl font-bold">Recent Orders</h3>
        <Button variant="outline" onClick={handleDownloadOrderList}>
          <Download className="mr-2 h-4 w-4" />
          Download Order List
        </Button>
      </div>

      <Tabs defaultValue="all" className="w-full">
        <TabsList>
          <TabsTrigger value="all">All Orders</TabsTrigger>
          <TabsTrigger value="pending">Pending</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
        </TabsList>
        <TabsContent value="all" className="space-y-4">
          <div className="rounded-md border">
            <div className="relative w-full overflow-auto">
              <table className="w-full caption-bottom text-sm">
                <thead className="[&_tr]:border-b">
                  <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                    <th className="h-12 px-4 text-left align-middle font-medium">Order #</th>
                    <th className="h-12 px-4 text-left align-middle font-medium">Date</th>
                    <th className="h-12 px-4 text-left align-middle font-medium">Customer</th>
                    <th className="h-12 px-4 text-left align-middle font-medium">Status</th>
                    <th className="h-12 px-4 text-left align-middle font-medium">Total</th>
                    <th className="h-12 px-4 text-left align-middle font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody className="[&_tr:last-child]:border-0">
                  {orders.length > 0 ? (
                    orders.map((order) => (
                      <tr
                        key={order._id}
                        className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted"
                      >
                        <td className="p-4 align-middle">{order.orderNumber}</td>
                        <td className="p-4 align-middle">{new Date(order.createdAt).toLocaleDateString()}</td>
                        <td className="p-4 align-middle">{order.user.name}</td>
                        <td className="p-4 align-middle">
                          <Badge variant={getStatusBadgeVariant(order.status)} className="capitalize">
                            {order.status}
                          </Badge>
                        </td>
                        <td className="p-4 align-middle">₹{order.total.toFixed(2)}</td>
                        <td className="p-4 align-middle">
                          <Link href={`/admin/orders/${order._id}`}>
                            <Button variant="outline" size="sm">
                              View
                            </Button>
                          </Link>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="p-4 text-center text-muted-foreground">
                        No orders found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </TabsContent>
        <TabsContent value="pending" className="space-y-4">
          <div className="rounded-md border">
            <div className="relative w-full overflow-auto">
              <table className="w-full caption-bottom text-sm">
                <thead className="[&_tr]:border-b">
                  <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                    <th className="h-12 px-4 text-left align-middle font-medium">Order #</th>
                    <th className="h-12 px-4 text-left align-middle font-medium">Date</th>
                    <th className="h-12 px-4 text-left align-middle font-medium">Customer</th>
                    <th className="h-12 px-4 text-left align-middle font-medium">Status</th>
                    <th className="h-12 px-4 text-left align-middle font-medium">Total</th>
                    <th className="h-12 px-4 text-left align-middle font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody className="[&_tr:last-child]:border-0">
                  {orders.filter(
                    (order) => order.status === "placed" || order.status === "preparing" || order.status === "ready",
                  ).length > 0 ? (
                    orders
                      .filter(
                        (order) =>
                          order.status === "placed" || order.status === "preparing" || order.status === "ready",
                      )
                      .map((order) => (
                        <tr
                          key={order._id}
                          className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted"
                        >
                          <td className="p-4 align-middle">{order.orderNumber}</td>
                          <td className="p-4 align-middle">{new Date(order.createdAt).toLocaleDateString()}</td>
                          <td className="p-4 align-middle">{order.user.name}</td>
                          <td className="p-4 align-middle">
                            <Badge variant={getStatusBadgeVariant(order.status)} className="capitalize">
                              {order.status}
                            </Badge>
                          </td>
                          <td className="p-4 align-middle">₹{order.total.toFixed(2)}</td>
                          <td className="p-4 align-middle">
                            <Link href={`/admin/orders/${order._id}`}>
                              <Button variant="outline" size="sm">
                                View
                              </Button>
                            </Link>
                          </td>
                        </tr>
                      ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="p-4 text-center text-muted-foreground">
                        No pending orders found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </TabsContent>
        <TabsContent value="completed" className="space-y-4">
          <div className="rounded-md border">
            <div className="relative w-full overflow-auto">
              <table className="w-full caption-bottom text-sm">
                <thead className="[&_tr]:border-b">
                  <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                    <th className="h-12 px-4 text-left align-middle font-medium">Order #</th>
                    <th className="h-12 px-4 text-left align-middle font-medium">Date</th>
                    <th className="h-12 px-4 text-left align-middle font-medium">Customer</th>
                    <th className="h-12 px-4 text-left align-middle font-medium">Status</th>
                    <th className="h-12 px-4 text-left align-middle font-medium">Total</th>
                    <th className="h-12 px-4 text-left align-middle font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody className="[&_tr:last-child]:border-0">
                  {orders.filter((order) => order.status === "completed" || order.status === "cancelled").length > 0 ? (
                    orders
                      .filter((order) => order.status === "completed" || order.status === "cancelled")
                      .map((order) => (
                        <tr
                          key={order._id}
                          className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted"
                        >
                          <td className="p-4 align-middle">{order.orderNumber}</td>
                          <td className="p-4 align-middle">{new Date(order.createdAt).toLocaleDateString()}</td>
                          <td className="p-4 align-middle">{order.user.name}</td>
                          <td className="p-4 align-middle">
                            <Badge variant={getStatusBadgeVariant(order.status)} className="capitalize">
                              {order.status}
                            </Badge>
                          </td>
                          <td className="p-4 align-middle">₹{order.total.toFixed(2)}</td>
                          <td className="p-4 align-middle">
                            <Link href={`/admin/orders/${order._id}`}>
                              <Button variant="outline" size="sm">
                                View
                              </Button>
                            </Link>
                          </td>
                        </tr>
                      ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="p-4 text-center text-muted-foreground">
                        No completed orders found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      <div className="flex justify-center">
        <Link href="/admin/orders">
          <Button variant="outline">View All Orders</Button>
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Total Revenue</CardTitle>
            <CardDescription>All-time revenue from completed orders</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">₹{revenueData?.totalRevenue || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Today's Revenue</CardTitle>
            <CardDescription>Revenue from completed orders today</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">₹{revenueData?.todayRevenue || 0}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Revenue History</CardTitle>
          <CardDescription>Daily revenue over time</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={revenueData?.revenueHistory || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="date"
                  tickFormatter={(date) => new Date(date).toLocaleDateString()}
                />
                <YAxis tickFormatter={(value) => `₹${value}`} />
                <Tooltip
                  labelFormatter={(date) => new Date(date).toLocaleDateString()}
                  formatter={(value) => [`₹${value}`, "Revenue"]}
                />
                <Line
                  type="monotone"
                  dataKey="amount"
                  stroke="#2563eb"
                  strokeWidth={2}
                  dot={{ r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

