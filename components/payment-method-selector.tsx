"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Input } from "@/components/ui/input"
import Image from "next/image"

interface PaymentMethodSelectorProps {
  onSelectMethod: (method: string, details?: any) => void
  onSubmit: () => void
  total: number
}

export function PaymentMethodSelector({ onSelectMethod, onSubmit, total }: PaymentMethodSelectorProps) {
  const [method, setMethod] = useState<string>("upi")
  const [upiId, setUpiId] = useState<string>("")
  const [file, setFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)

  const handleMethodChange = (value: string) => {
    setMethod(value)
    onSelectMethod(value)
  }

  const handleUpiIdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUpiId(e.target.value)
    onSelectMethod("upi", { upiId: e.target.value })
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0]
      setFile(selectedFile)

      // Create a preview URL
      const reader = new FileReader()
      reader.onload = () => {
        setPreviewUrl(reader.result as string)
      }
      reader.readAsDataURL(selectedFile)

      onSelectMethod("qr_screenshot", { file: selectedFile })
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Payment Method</CardTitle>
        <CardDescription>Choose how you want to pay for your order</CardDescription>
      </CardHeader>
      <CardContent>
        <RadioGroup value={method} onValueChange={handleMethodChange} className="space-y-4">
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="upi" id="upi" />
            <Label htmlFor="upi">UPI Payment</Label>
          </div>

          {method === "upi" && (
            <div className="pl-6 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="upi-id">UPI ID</Label>
                <Input id="upi-id" placeholder="yourname@upi" value={upiId} onChange={handleUpiIdChange} />
              </div>
            </div>
          )}

          <div className="flex items-center space-x-2">
            <RadioGroupItem value="qr_screenshot" id="qr_screenshot" />
            <Label htmlFor="qr_screenshot">QR Code Payment Screenshot</Label>
          </div>

          {method === "qr_screenshot" && (
            <div className="pl-6 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="screenshot">Upload Payment Screenshot</Label>
                <div className="grid gap-2">
                  <div className="flex items-center justify-center border-2 border-dashed rounded-md p-4">
                    {previewUrl ? (
                      <div className="relative w-full h-48">
                        <Image
                          src={previewUrl || "/placeholder.svg"}
                          alt="Payment screenshot"
                          fill
                          className="object-contain"
                        />
                      </div>
                    ) : (
                      <div className="text-center">
                        <p className="text-sm text-muted-foreground">Click to upload or drag and drop</p>
                        <p className="text-xs text-muted-foreground">PNG, JPG or JPEG (max 5MB)</p>
                      </div>
                    )}
                    <Input
                      id="screenshot"
                      type="file"
                      accept="image/png, image/jpeg, image/jpg"
                      className="absolute inset-0 opacity-0 cursor-pointer"
                      onChange={handleFileChange}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </RadioGroup>
      </CardContent>
      <CardFooter>
        <Button
          onClick={onSubmit}
          className="w-full"
          disabled={(method === "upi" && !upiId) || (method === "qr_screenshot" && !file)}
        >
          Pay ₹{total.toFixed(2)}
        </Button>
      </CardFooter>
    </Card>
  )
}

