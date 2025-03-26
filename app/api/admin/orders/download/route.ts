import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { connectToDatabase } from "@/lib/mongodb"
import jwt from "jsonwebtoken"
import * as docx from "docx"

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
    const ordersCollection = db.collection("orders")

    // Find today's orders
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const orders = await ordersCollection
      .find({
        createdAt: { $gte: today },
      })
      .sort({ createdAt: -1 })
      .toArray()

    // Generate Word document
    const doc = new docx.Document({
      sections: [
        {
          properties: {},
          children: [
            new docx.Paragraph({
              text: "SVCE Cafeteria - Orders List",
              heading: docx.HeadingLevel.HEADING_1,
              alignment: docx.AlignmentType.CENTER,
            }),
            new docx.Paragraph({
              text: `Date: ${today.toLocaleDateString()}`,
              alignment: docx.AlignmentType.CENTER,
            }),
            new docx.Paragraph({
              text: "",
            }),
            ...orders.flatMap((order) => [
              new docx.Paragraph({
                text: `Order #${order.orderNumber}`,
                heading: docx.HeadingLevel.HEADING_2,
              }),
              new docx.Paragraph({
                text: `Customer: ${order.user.name} (${order.user.email})`,
              }),
              new docx.Paragraph({
                text: `Date: ${new Date(order.createdAt).toLocaleString()}`,
              }),
              new docx.Paragraph({
                text: `Status: ${order.status}`,
              }),
              new docx.Paragraph({
                text: `Payment Method: ${order.paymentMethod}`,
              }),
              new docx.Paragraph({
                text: "Items:",
              }),
              new docx.Table({
                width: {
                  size: 100,
                  type: docx.WidthType.PERCENTAGE,
                },
                rows: [
                  new docx.TableRow({
                    children: [
                      new docx.TableCell({
                        children: [new docx.Paragraph("Item")],
                        width: {
                          size: 40,
                          type: docx.WidthType.PERCENTAGE,
                        },
                      }),
                      new docx.TableCell({
                        children: [new docx.Paragraph("Quantity")],
                        width: {
                          size: 20,
                          type: docx.WidthType.PERCENTAGE,
                        },
                      }),
                      new docx.TableCell({
                        children: [new docx.Paragraph("Price")],
                        width: {
                          size: 20,
                          type: docx.WidthType.PERCENTAGE,
                        },
                      }),
                      new docx.TableCell({
                        children: [new docx.Paragraph("Total")],
                        width: {
                          size: 20,
                          type: docx.WidthType.PERCENTAGE,
                        },
                      }),
                    ],
                  }),
                  ...order.items.map(
                    (item) =>
                      new docx.TableRow({
                        children: [
                          new docx.TableCell({
                            children: [new docx.Paragraph(item.name)],
                          }),
                          new docx.TableCell({
                            children: [new docx.Paragraph(item.quantity.toString())],
                          }),
                          new docx.TableCell({
                            children: [new docx.Paragraph(`₹${item.price.toFixed(2)}`)],
                          }),
                          new docx.TableCell({
                            children: [new docx.Paragraph(`₹${(item.price * item.quantity).toFixed(2)}`)],
                          }),
                        ],
                      }),
                  ),
                  new docx.TableRow({
                    children: [
                      new docx.TableCell({
                        children: [new docx.Paragraph("")],
                        columnSpan: 3,
                      }),
                      new docx.TableCell({
                        children: [
                          new docx.Paragraph({
                            text: `₹${order.total.toFixed(2)}`,
                            bold: true,
                          }),
                        ],
                      }),
                    ],
                  }),
                ],
              }),
              new docx.Paragraph({
                text: "",
              }),
            ]),
          ],
        },
      ],
    })

    // Generate buffer
    const buffer = await docx.Packer.toBuffer(doc)

    // Return the document
    return new NextResponse(buffer, {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "Content-Disposition": `attachment; filename="orders-${today.toISOString().split("T")[0]}.docx"`,
      },
    })
  } catch (error) {
    console.error("Error generating order list:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}

