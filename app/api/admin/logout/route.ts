import { NextResponse } from "next/server"
import { cookies } from "next/headers"

export async function POST() {
  // Clear the admin auth cookie
  cookies().set({
    name: "admin_token",
    value: "",
    expires: new Date(0),
    path: "/",
  })

  return NextResponse.json({ message: "Logged out successfully" })
}

