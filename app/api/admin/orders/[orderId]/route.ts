import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { connectToDatabase } from "@/lib/mongodb"
import jwt from "jsonwebtoken"
import { ObjectId } from "mongodb"

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key"

export async function PUT(
  request: Request,
  { params }: { params: { orderId: string } }
) {
  try {
    // Get token from cookies
    const token = cookies().get("admin_token")?.value

    if (!token) {
      return NextResponse.json({ message: "Not authenticated" }, { status: 401 })
    }

    // Verify token
    jwt.verify(token, JWT_SECRET)

    const { status } = await request.json()
    const db = await connectToDatabase()
    const ordersCollection = db.collection("orders")

    // Update order status
    const result = await ordersCollection.updateOne(
      { _id: new ObjectId(params.orderId) },
      { $set: { status } }
    )

    if (result.matchedCount === 0) {
      return NextResponse.json({ message: "Order not found" }, { status: 404 })
    }

    // If order is completed, update revenue
    if (status === "completed") {
      const order = await ordersCollection.findOne({ _id: new ObjectId(params.orderId) })
      if (order) {
        const revenueCollection = db.collection("revenue")
        await revenueCollection.insertOne({
          orderId: order._id,
          amount: order.totalAmount,
          date: new Date(),
        })
      }
    }

    return NextResponse.json({ message: "Order updated successfully" })
  } catch (error) {
    console.error("Error updating order:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
} 