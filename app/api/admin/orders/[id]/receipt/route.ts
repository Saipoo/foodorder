import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { connectToDatabase } from "@/lib/mongodb"
import jwt from "jsonwebtoken"
import { ObjectId } from "mongodb"
import PDFDocument from "pdfkit"

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
    const ordersCollection = db.collection("orders")

    // Find order
    const order = await ordersCollection.findOne({
      _id: new ObjectId(params.id),
    })

    if (!order) {
      return NextResponse.json({ message: "Order not found" }, { status: 404 })
    }

    // Generate PDF receipt
    const pdfBuffer = await generatePdfReceipt(order)

    // Return the PDF
    return new NextResponse(pdfBuffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="receipt-${order.orderNumber}.pdf"`,
      },
    })
  } catch (error) {
    console.error("Error generating receipt:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}

async function generatePdfReceipt(order: any): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50 })
      const buffers: Buffer[] = []

      doc.on("data", (buffer) => buffers.push(buffer))
      doc.on("end", () => resolve(Buffer.concat(buffers)))
      doc.on("error", reject)

      // Header
      doc
        .fontSize(20)
        .text("SVCE Cafeteria", { align: "center" })
        .fontSize(12)
        .text("Order Receipt", { align: "center" })
        .moveDown()

      // Order details
      doc
        .fontSize(14)
        .text(`Order #${order.orderNumber}`)
        .fontSize(10)
        .text(`Date: ${new Date(order.createdAt).toLocaleString()}`)
        .text(`Customer: ${order.user.name}`)
        .text(`Email: ${order.user.email}`)
        .text(`Status: ${order.status}`)
        .text(`Payment Method: ${order.paymentMethod}`)
        .moveDown()

      // Items table
      doc.fontSize(12).text("Order Items", { underline: true }).moveDown(0.5)

      // Table headers
      const tableTop = doc.y
      const itemX = 50
      const qtyX = 300
      const priceX = 370
      const totalX = 450

      doc
        .fontSize(10)
        .text("Item", itemX, tableTop)
        .text("Qty", qtyX, tableTop)
        .text("Price", priceX, tableTop)
        .text("Total", totalX, tableTop)
        .moveDown()

      // Draw line
      doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke().moveDown()

      // Table rows
      let tableY = doc.y
      order.items.forEach((item: any) => {
        doc
          .fontSize(10)
          .text(item.name, itemX, tableY)
          .text(item.quantity.toString(), qtyX, tableY)
          .text(`₹${item.price.toFixed(2)}`, priceX, tableY)
          .text(`₹${(item.price * item.quantity).toFixed(2)}`, totalX, tableY)
        tableY = doc.y + 10
        doc.moveDown()
      })

      // Draw line
      doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke().moveDown()

      // Totals
      const subtotal = order.total / 1.05
      const tax = order.total - subtotal

      doc
        .fontSize(10)
        .text("Subtotal:", 350, doc.y)
        .text(`₹${subtotal.toFixed(2)}`, totalX, doc.y)
        .moveDown(0.5)
        .text("Tax (5%):", 350, doc.y)
        .text(`₹${tax.toFixed(2)}`, totalX, doc.y)
        .moveDown(0.5)
        .fontSize(12)
        .text("Total:", 350, doc.y, { bold: true })
        .text(`₹${order.total.toFixed(2)}`, totalX, doc.y, { bold: true })
        .moveDown()

      // Footer
      doc
        .fontSize(10)
        .text("Thank you for your order!", { align: "center" })
        .moveDown(0.5)
        .text("For any questions, please contact cafeteria@svce.edu.in", { align: "center" })

      doc.end()
    } catch (error) {
      reject(error)
    }
  })
}

