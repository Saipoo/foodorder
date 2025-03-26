import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { connectToDatabase } from "@/lib/mongodb"
import jwt from "jsonwebtoken"
import { ObjectId } from "mongodb"
import nodemailer from "nodemailer"

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key"

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    // Get token from cookies
    const token = cookies().get("admin_token")?.value

    if (!token) {
      return NextResponse.json({ message: "Not authenticated" }, { status: 401 })
    }

    // Verify token
    jwt.verify(token, JWT_SECRET)

    const { status } = await request.json()

    // Validate input
    if (!status) {
      return NextResponse.json({ message: "Status is required" }, { status: 400 })
    }

    // Validate status value
    const validStatuses = ["placed", "preparing", "ready", "completed", "cancelled"]
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ message: "Invalid status value" }, { status: 400 })
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

    // Update order status
    const updatedOrder = await ordersCollection.findOneAndUpdate(
      { _id: new ObjectId(params.id) },
      {
        $set: {
          status,
          updatedAt: new Date(),
        },
      },
      { returnDocument: "after" },
    )

    // Send email notification about status change
    await sendStatusUpdateEmail(order.user.email, updatedOrder.value)

    return NextResponse.json({ order: updatedOrder.value })
  } catch (error) {
    console.error("Error updating order status:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}

async function sendStatusUpdateEmail(email: string, order: any) {
  try {
    // Create a test account if no SMTP credentials are provided
    const testAccount = await nodemailer.createTestAccount()

    // Create a transporter
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || "smtp.ethereal.email",
      port: Number.parseInt(process.env.SMTP_PORT || "587"),
      secure: process.env.SMTP_SECURE === "true",
      auth: {
        user: process.env.SMTP_USER || testAccount.user,
        pass: process.env.SMTP_PASS || testAccount.pass,
      },
    })

    // Status message
    let statusMessage = ""
    switch (order.status) {
      case "preparing":
        statusMessage = "Your order is now being prepared."
        break
      case "ready":
        statusMessage = "Your order is ready for pickup at the cafeteria counter."
        break
      case "completed":
        statusMessage = "Your order has been completed. Thank you for your order!"
        break
      case "cancelled":
        statusMessage = "Your order has been cancelled. If you have any questions, please contact the cafeteria staff."
        break
      default:
        statusMessage = "Your order status has been updated."
    }

    // Send email
    const info = await transporter.sendMail({
      from: '"SVCE Cafeteria" <cafeteria@svce.edu.in>',
      to: email,
      subject: `Order #${order.orderNumber} Status Update`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Order Status Update</h2>
          <p>Your order #${order.orderNumber} status has been updated.</p>
          
          <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <h3 style="margin-top: 0;">Order Status: ${order.status.toUpperCase()}</h3>
            <p>${statusMessage}</p>
          </div>
          
          <div style="margin-top: 30px; text-align: center; color: #777;">
            <p>If you have any questions about your order, please contact us at cafeteria@svce.edu.in</p>
            <p>Thank you for ordering from SVCE Cafeteria!</p>
          </div>
        </div>
      `,
    })

    console.log("Email sent: %s", info.messageId)
    // Preview URL for testing (only works with Ethereal)
    console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info))
  } catch (error) {
    console.error("Error sending email:", error)
  }
}

