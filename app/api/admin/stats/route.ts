import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { connectToDatabase } from "@/lib/mongodb"
import jwt from "jsonwebtoken"

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key"

export async function GET() {
  try {
    // Get token from cookies
    const token = cookies().get("admin_token")?.value

    if (!token) {
      return NextResponse.json({ message: "Not authenticated" }, { status: 401 })
    }

    // Verify token
    jwt.verify(token, JWT_SECRET)

    const db = await connectToDatabase()
    const ordersCollection = db.collection("orders")

    // Get total orders count
    const totalOrders = await ordersCollection.countDocuments()

    // Get pending orders count
    const pendingOrders = await ordersCollection.countDocuments({
      status: { $in: ["placed", "preparing", "ready"] },
    })

    // Get completed orders count
    const completedOrders = await ordersCollection.countDocuments({
      status: "completed",
    })

    // Calculate total revenue
    const orders = await ordersCollection.find({ status: "completed" }).toArray()
    const totalRevenue = orders.reduce((sum, order) => sum + order.total, 0)

    return NextResponse.json({
      stats: {
        totalOrders,
        pendingOrders,
        completedOrders,
        totalRevenue,
      },
    })
  } catch (error) {
    console.error("Error fetching stats:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}

