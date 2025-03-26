"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { ArrowLeft } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/lib/auth-provider"
import type { CartItem } from "@/lib/types"

const paymentFormSchema = z.object({
  upiId: z.string().min(1, "UPI ID is required"),
})

const qrFormSchema = z.object({
  paymentScreenshot: z.instanceof(File).refine((file) => file.size > 0, "Payment screenshot is required"),
})

export default function CheckoutPage() {
  const router = useRouter()
  const { toast } = useToast()
  const { user } = useAuth()
  const [cart, setCart] = useState<CartItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState("upi")
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)

  const upiForm = useForm<z.infer<typeof paymentFormSchema>>({
    resolver: zodResolver(paymentFormSchema),
    defaultValues: {
      upiId: "",
    },
  })

  const qrForm = useForm<z.infer<typeof qrFormSchema>>({
    resolver: zodResolver(qrFormSchema),
  })

  // Load cart from localStorage
  useEffect(() => {
    if (!user) {
      router.push("/login")
      return
    }

    const savedCart = localStorage.getItem("cart")
    if (savedCart) {
      try {
        const parsedCart = JSON.parse(savedCart)
        if (parsedCart.length === 0) {
          router.push("/menu")
          return
        }
        setCart(parsedCart)
      } catch (e) {
        console.error("Error parsing cart from localStorage:", e)
      }
    } else {
      router.push("/menu")
      return
    }
    setIsLoading(false)
  }, [user, router])

  const getSubtotal = () => {
    return cart.reduce((total, item) => total + item.price * item.quantity, 0)
  }

  const getTaxes = () => {
    return getSubtotal() * 0.05 // 5% tax
  }

  const getTotal = () => {
    return getSubtotal() + getTaxes()
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      qrForm.setValue("paymentScreenshot", file)

      // Create a preview URL
      const url = URL.createObjectURL(file)
      setPreviewUrl(url)

      // Clean up the URL when component unmounts
      return () => URL.revokeObjectURL(url)
    }
  }

  const handleUpiSubmit = async (values: z.infer<typeof paymentFormSchema>) => {
    if (!user) {
      toast({
        title: "Login required",
        description: "Please login to proceed with your order.",
        variant: "destructive",
      })
      router.push("/login")
      return
    }

    setIsSubmitting(true)
    try {
      const orderData = {
        items: cart,
        paymentMethod: "upi",
        paymentDetails: {
          upiId: values.upiId,
        },
        total: getTotal(),
      }

      const response = await fetch("/api/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(orderData),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || "Failed to place order")
      }

      const data = await response.json()

      // Clear cart after successful order
      localStorage.removeItem("cart")

      toast({
        title: "Order placed successfully",
        description: `Your order #${data.order.orderNumber} has been placed.`,
      })

      router.push(`/orders/${data.order._id}`)
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Failed to place order",
        description: error instanceof Error ? error.message : "Something went wrong",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleQrSubmit = async (values: z.infer<typeof qrFormSchema>) => {
    if (!user) {
      toast({
        title: "Login required",
        description: "Please login to proceed with your order.",
        variant: "destructive",
      })
      router.push("/login")
      return
    }

    setIsSubmitting(true)
    try {
      // Create a FormData object to send the file
      const formData = new FormData()
      formData.append("paymentScreenshot", values.paymentScreenshot)

      // Add other order details
      formData.append("items", JSON.stringify(cart))
      formData.append("paymentMethod", "qr")
      formData.append("total", getTotal().toString())

      const response = await fetch("/api/orders/with-image", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || "Failed to place order")
      }

      const data = await response.json()

      // Clear cart after successful order
      localStorage.removeItem("cart")

      toast({
        title: "Order placed successfully",
        description: `Your order #${data.order.orderNumber} has been placed.`,
      })

      router.push(`/orders/${data.order._id}`)
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Failed to place order",
        description: error instanceof Error ? error.message : "Something went wrong",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    )
  }

  return (
    <div className="container py-6">
      <div className="flex items-center gap-2 mb-6">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-3xl font-bold tracking-tight">Checkout</h1>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Payment Method</CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="upi" onValueChange={setPaymentMethod}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="upi">UPI Payment</TabsTrigger>
                  <TabsTrigger value="qr">QR Code Upload</TabsTrigger>
                </TabsList>
                <TabsContent value="upi" className="pt-4">
                  <Form {...upiForm}>
                    <form onSubmit={upiForm.handleSubmit(handleUpiSubmit)} className="space-y-4">
                      <FormField
                        control={upiForm.control}
                        name="upiId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>UPI ID</FormLabel>
                            <FormControl>
                              <Input placeholder="yourname@upi" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <Button type="submit" className="w-full" disabled={isSubmitting}>
                        {isSubmitting ? "Processing..." : "Pay Now"}
                      </Button>
                    </form>
                  </Form>
                </TabsContent>
                <TabsContent value="qr" className="pt-4">
                  <Form {...qrForm}>
                    <form onSubmit={qrForm.handleSubmit(handleQrSubmit)} className="space-y-4">
                      <div className="space-y-2">
                        <p className="text-sm text-muted-foreground">
                          Please scan the QR code below and upload a screenshot of your payment.
                        </p>
                        <div className="flex justify-center p-4 border rounded-md">
                          <img
                            src="/placeholder.svg?height=200&width=200"
                            alt="Payment QR Code"
                            className="h-48 w-48"
                          />
                        </div>
                      </div>
                      <FormField
                        control={qrForm.control}
                        name="paymentScreenshot"
                        render={({ field: { value, onChange, ...fieldProps } }) => (
                          <FormItem>
                            <FormLabel>Upload Payment Screenshot</FormLabel>
                            <FormControl>
                              <div className="flex flex-col gap-2">
                                <Input type="file" accept="image/*" onChange={handleFileChange} {...fieldProps} />
                                {previewUrl && (
                                  <div className="mt-2 border rounded-md p-2">
                                    <img
                                      src={previewUrl || "/placeholder.svg"}
                                      alt="Payment Screenshot Preview"
                                      className="max-h-40 mx-auto"
                                    />
                                  </div>
                                )}
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <Button type="submit" className="w-full" disabled={isSubmitting}>
                        {isSubmitting ? "Processing..." : "Submit Payment"}
                      </Button>
                    </form>
                  </Form>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {cart.map((item) => (
                <div key={item._id} className="flex justify-between">
                  <span>
                    {item.name} x {item.quantity}
                  </span>
                  <span>₹{(item.price * item.quantity).toFixed(2)}</span>
                </div>
              ))}
              <Separator />
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>₹{getSubtotal().toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Taxes (5%)</span>
                <span>₹{getTaxes().toFixed(2)}</span>
              </div>
              <Separator />
              <div className="flex justify-between font-bold">
                <span>Total</span>
                <span>₹{getTotal().toFixed(2)}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

