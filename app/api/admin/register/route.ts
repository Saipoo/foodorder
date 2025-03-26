import { NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import bcrypt from "bcryptjs"

export async function POST(request: Request) {
  try {
    const { name, email, password } = await request.json()

    // Validate input
    if (!name || !email || !password) {
      return NextResponse.json({ message: "Missing required fields" }, { status: 400 })
    }

    const db = await connectToDatabase()
    const adminsCollection = db.collection("admins")

    // Check if admin already exists
    const existingAdmin = await adminsCollection.findOne({ email })
    if (existingAdmin) {
      return NextResponse.json({ message: "Admin with this email already exists" }, { status: 409 })
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10)

    // Create admin
    const result = await adminsCollection.insertOne({
      name,
      email,
      password: hashedPassword,
      role: "admin",
      createdAt: new Date(),
    })

    return NextResponse.json({ message: "Admin registered successfully", adminId: result.insertedId }, { status: 201 })
  } catch (error) {
    console.error("Admin registration error:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
} 