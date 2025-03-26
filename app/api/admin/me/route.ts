import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { connectToDatabase } from "@/lib/mongodb"
import jwt from "jsonwebtoken"
import { ObjectId } from "mongodb"

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key"

export async function GET() {
  try {
    // Get token from cookies
    const cookieStore = await cookies()
    const token = cookieStore.get("admin_token")?.value

    if (!token) {
      return NextResponse.json({ message: "Not authenticated" }, { status: 401 })
    }

    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET) as {
      adminId: string
      email: string
    }

    const db = await connectToDatabase()
    const adminsCollection = db.collection("admins")

    // Find admin
    const admin = await adminsCollection.findOne({
      _id: new ObjectId(decoded.adminId),
    })

    if (!admin) {
      return NextResponse.json({ message: "Admin not found" }, { status: 404 })
    }

    // Return admin data (excluding password)
    const { password, ...adminWithoutPassword } = admin

    return NextResponse.json({ admin: adminWithoutPassword })
  } catch (error) {
    console.error("Auth error:", error)
    return NextResponse.json({ message: "Not authenticated" }, { status: 401 })
  }
}

