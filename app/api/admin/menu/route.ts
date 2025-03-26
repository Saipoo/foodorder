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
    const menuCollection = db.collection("menu")

    const menuItems = await menuCollection.find().toArray()

    return NextResponse.json({ menuItems })
  } catch (error) {
    console.error("Error fetching menu:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    // Get token from cookies
    const token = cookies().get("admin_token")?.value

    if (!token) {
      return NextResponse.json({ message: "Not authenticated" }, { status: 401 })
    }

    // Verify token
    jwt.verify(token, JWT_SECRET)

    const menuItem = await request.json()

    // Validate input
    if (!menuItem.name || !menuItem.description || !menuItem.price || !menuItem.category) {
      return NextResponse.json({ message: "Missing required fields" }, { status: 400 })
    }

    const db = await connectToDatabase()
    const menuCollection = db.collection("menu")

    // Insert menu item
    const result = await menuCollection.insertOne({
      ...menuItem,
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    const insertedItem = await menuCollection.findOne({ _id: result.insertedId })

    return NextResponse.json({ message: "Menu item added successfully", menuItem: insertedItem }, { status: 201 })
  } catch (error) {
    console.error("Error adding menu item:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}

