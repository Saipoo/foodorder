"use client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"
import { useCart } from "@/context/cart-context"
import { MinusIcon, PlusIcon } from "lucide-react"

interface MenuItem {
  _id: string
  name: string
  description: string
  price: number
  category: string
  available: boolean
}

interface MenuItemCardProps {
  item: MenuItem
}

export function MenuItemCard({ item }: MenuItemCardProps) {
  const { toast } = useToast()
  const { addToCart, removeFromCart, getItemQuantity } = useCart()
  const quantity = getItemQuantity(item._id)

  const handleAddToCart = () => {
    addToCart({
      _id: item._id,
      name: item.name,
      price: item.price,
      quantity: 1,
    })

    toast({
      title: "Added to cart",
      description: `${item.name} has been added to your cart.`,
    })
  }

  const handleRemoveFromCart = () => {
    removeFromCart(item._id)
  }

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-4">
        <div className="flex flex-col gap-2">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="font-semibold">{item.name}</h3>
              <p className="text-sm text-muted-foreground">{item.description}</p>
            </div>
            <div className="font-semibold">₹{item.price}</div>
          </div>
        </div>
      </CardContent>
      <CardFooter className="p-4 pt-0 flex justify-between items-center">
        {!item.available ? (
          <span className="text-sm text-destructive">Currently unavailable</span>
        ) : quantity === 0 ? (
          <Button onClick={handleAddToCart} className="w-full">
            Add to Cart
          </Button>
        ) : (
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={handleRemoveFromCart} className="h-8 w-8">
              <MinusIcon className="h-4 w-4" />
            </Button>
            <span className="w-8 text-center">{quantity}</span>
            <Button variant="outline" size="icon" onClick={handleAddToCart} className="h-8 w-8">
              <PlusIcon className="h-4 w-4" />
            </Button>
          </div>
        )}
      </CardFooter>
    </Card>
  )
}

