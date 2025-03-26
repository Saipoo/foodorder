import { NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"

export async function GET() {
  try {
    const db = await connectToDatabase()
    const menuCollection = db.collection("menu")

    const menuItems = await menuCollection.find({ available: true }).toArray()

    return NextResponse.json({ menuItems })
  } catch (error) {
    console.error("Error fetching menu:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}

