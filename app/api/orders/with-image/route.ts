import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { connectToDatabase } from "@/lib/mongodb"
import jwt from "jsonwebtoken"
import { ObjectId } from "mongodb"
import nodemailer from "nodemailer"

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key"

export async function POST(request: Request) {
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
    }

    // Parse form data
    const formData = await request.formData()
    const paymentScreenshot = formData.get("paymentScreenshot") as File
    const itemsJson = formData.get("items") as string
    const paymentMethod = formData.get("paymentMethod") as string
    const total = Number.parseFloat(formData.get("total") as string)

    // Validate input
    if (!itemsJson || !paymentScreenshot) {
      return NextResponse.json({ message: "Invalid order data" }, { status: 400 })
    }

    const items = JSON.parse(itemsJson)

    // Convert payment screenshot to base64
    const arrayBuffer = await paymentScreenshot.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    const base64Image = buffer.toString("base64")
    const imageType = paymentScreenshot.type
    const dataUrl = `data:${imageType};base64,${base64Image}`

    const db = await connectToDatabase()
    const ordersCollection = db.collection("orders")
    const usersCollection = db.collection("users")

    // Get user
    const user = await usersCollection.findOne({
      _id: new ObjectId(decoded.userId),
    })

    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 })
    }

    // Generate order number
    const orderCount = await ordersCollection.countDocuments()
    const orderNumber = `ORD${(orderCount + 1).toString().padStart(4, "0")}`

    // Create order
    const order = {
      orderNumber,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
      },
      items,
      total,
      status: "placed",
      paymentMethod,
      paymentDetails: {
        screenshot: dataUrl,
      },
      estimatedTime: 15, // Default 15 minutes
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    const result = await ordersCollection.insertOne(order)
    order._id = result.insertedId

    // Send email notification
    await sendOrderConfirmationEmail(user.email, order)

    return NextResponse.json({ message: "Order placed successfully", order }, { status: 201 })
  } catch (error) {
    console.error("Order creation error:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}

async function sendOrderConfirmationEmail(email: string, order: any) {
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

    // Generate order items HTML
    const itemsHtml = order.items
      .map(
        (item: any) =>
          `<tr>
            <td style="padding: 8px; border-bottom: 1px solid #ddd;">${item.name}</td>
            <td style="padding: 8px; border-bottom: 1px solid #ddd;">${item.quantity}</td>
            <td style="padding: 8px; border-bottom: 1px solid #ddd;">₹${item.price.toFixed(2)}</td>
            <td style="padding: 8px; border-bottom: 1px solid #ddd;">₹${(item.price * item.quantity).toFixed(2)}</td>
          </tr>`,
      )
      .join("")

    // Send email
    const info = await transporter.sendMail({
      from: '"SVCE Cafeteria" <cafeteria@svce.edu.in>',
      to: email,
      subject: `Order Confirmation - #${order.orderNumber}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Order Confirmation</h2>
          <p>Thank you for your order! Your order has been received and is being processed.</p>
          
          <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <h3 style="margin-top: 0;">Order Details</h3>
            <p><strong>Order Number:</strong> #${order.orderNumber}</p>
            <p><strong>Date:</strong> ${new Date(order.createdAt).toLocaleString()}</p>
            <p><strong>Payment Method:</strong> ${order.paymentMethod.toUpperCase()}</p>
          </div>
          
          <h3>Order Summary</h3>
          <table style="width: 100%; border-collapse: collapse;">
            <thead>
              <tr style="background-color: #f2f2f2;">
                <th style="padding: 8px; text-align: left; border-bottom: 1px solid #ddd;">Item</th>
                <th style="padding: 8px; text-align: left; border-bottom: 1px solid #ddd;">Quantity</th>
                <th style="padding: 8px; text-align: left; border-bottom: 1px solid #ddd;">Price</th>
                <th style="padding: 8px; text-align: left; border-bottom: 1px solid #ddd;">Total</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
            <tfoot>
              <tr>
                <td colspan="3" style="padding: 8px; text-align: right; font-weight: bold;">Subtotal:</td>
                <td style="padding: 8px;">₹${(order.total / 1.05).toFixed(2)}</td>
              </tr>
              <tr>
                <td colspan="3" style="padding: 8px; text-align: right; font-weight: bold;">Tax (5%):</td>
                <td style="padding: 8px;">₹${(order.total - order.total / 1.05).toFixed(2)}</td>
              </tr>
              <tr>
                <td colspan="3" style="padding: 8px; text-align: right; font-weight: bold;">Total:</td>
                <td style="padding: 8px; font-weight: bold;">₹${order.total.toFixed(2)}</td>
              </tr>
            </tfoot>
          </table>
          
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

