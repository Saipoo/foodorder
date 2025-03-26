import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { connectToDatabase } from "@/lib/mongodb"
import jwt from "jsonwebtoken"
import { ObjectId } from "mongodb"

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key"

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    // Get token from cookies
    const token = cookies().get("auth_token")?.value

    if (!token) {
      return NextResponse.json({ message: "Not authenticated" }, { status: 401 })
    }

    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET) as {
      userId: string
      email: string
      role: string
    }

    const db = await connectToDatabase()
    const ordersCollection = db.collection("orders")

    // Find order
    const order = await ordersCollection.findOne({
      _id: new ObjectId(params.id),
    })

    if (!order) {
      return NextResponse.json({ message: "Order not found" }, { status: 404 })
    }

    // Check if user has permission to view this order
    if (decoded.role !== "admin" && order.user._id.toString() !== decoded.userId) {
      return NextResponse.json({ message: "Not authorized to view this order" }, { status: 403 })
    }

    return NextResponse.json({ order })
  } catch (error) {
    console.error("Error fetching order:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}

