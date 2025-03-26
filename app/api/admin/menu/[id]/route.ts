import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { connectToDatabase } from "@/lib/mongodb"
import jwt from "jsonwebtoken"
import { ObjectId } from "mongodb"

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key"

export async function GET(request: Request, { params }: { params: { id: string } }) {
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

    // Find menu item
    const menuItem = await menuCollection.findOne({
      _id: new ObjectId(params.id),
    })

    if (!menuItem) {
      return NextResponse.json({ message: "Menu item not found" }, { status: 404 })
    }

    return NextResponse.json({ menuItem })
  } catch (error) {
    console.error("Error fetching menu item:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
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

    // Check if menu item exists
    const existingItem = await menuCollection.findOne({
      _id: new ObjectId(params.id),
    })

    if (!existingItem) {
      return NextResponse.json({ message: "Menu item not found" }, { status: 404 })
    }

    // Update menu item
    const updatedItem = await menuCollection.findOneAndUpdate(
      { _id: new ObjectId(params.id) },
      {
        $set: {
          ...menuItem,
          updatedAt: new Date(),
        },
      },
      { returnDocument: "after" },
    )

    return NextResponse.json({
      message: "Menu item updated successfully",
      menuItem: updatedItem.value,
    })
  } catch (error) {
    console.error("Error updating menu item:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
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

    // Check if menu item exists
    const existingItem = await menuCollection.findOne({
      _id: new ObjectId(params.id),
    })

    if (!existingItem) {
      return NextResponse.json({ message: "Menu item not found" }, { status: 404 })
    }

    // Delete menu item
    await menuCollection.deleteOne({ _id: new ObjectId(params.id) })

    return NextResponse.json({
      message: "Menu item deleted successfully",
    })
  } catch (error) {
    console.error("Error deleting menu item:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}

