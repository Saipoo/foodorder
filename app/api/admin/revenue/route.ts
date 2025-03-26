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
    const revenueCollection = db.collection("revenue")

    // Get all revenue entries
    const revenue = await revenueCollection.find().sort({ date: -1 }).toArray()

    // Calculate total revenue
    const totalRevenue = revenue.reduce((sum, entry) => sum + entry.amount, 0)

    // Calculate today's revenue
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const todayRevenue = revenue
      .filter((entry) => new Date(entry.date) >= today)
      .reduce((sum, entry) => sum + entry.amount, 0)

    return NextResponse.json({
      totalRevenue,
      todayRevenue,
      revenueHistory: revenue,
    })
  } catch (error) {
    console.error("Error fetching revenue:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
} 