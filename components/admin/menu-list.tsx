"use client"

import { useState, useEffect } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { useToast } from "@/components/ui/use-toast"
import { MenuItemForm } from "@/components/admin/menu-item-form"
import { PlusIcon, Pencil, Trash2 } from "lucide-react"

interface MenuItem {
  _id: string
  name: string
  description: string
  price: number
  category: string
  available: boolean
}

export function MenuList() {
  const { toast } = useToast()
  const [menuItems, setMenuItems] = useState<MenuItem[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [updatingAvailability, setUpdatingAvailability] = useState<string | null>(null)

  useEffect(() => {
    fetchMenuItems()
  }, [])

  const fetchMenuItems = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/admin/menu")

      if (!response.ok) {
        throw new Error("Failed to fetch menu items")
      }

      const data = await response.json()
      setMenuItems(data.menuItems)
    } catch (error) {
      console.error("Error fetching menu items:", error)
      toast({
        title: "Error",
        description: "Failed to fetch menu items. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleAddItem = async (data: MenuItem) => {
    try {
      const response = await fetch("/api/admin/menu", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        throw new Error("Failed to add menu item")
      }

      const result = await response.json()
      setMenuItems([...menuItems, result.menuItem])
      setIsAddDialogOpen(false)
    } catch (error) {
      console.error("Error adding menu item:", error)
      throw error
    }
  }

  const handleEditItem = async (data: MenuItem) => {
    if (!selectedItem) return

    try {
      const response = await fetch(`/api/admin/menu/${selectedItem._id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        throw new Error("Failed to update menu item")
      }

      const result = await response.json()

      setMenuItems(menuItems.map((item) => (item._id === selectedItem._id ? result.menuItem : item)))

      setIsEditDialogOpen(false)
      setSelectedItem(null)
    } catch (error) {
      console.error("Error updating menu item:", error)
      throw error
    }
  }

  const handleDeleteItem = async (id: string) => {
    if (!confirm("Are you sure you want to delete this menu item?")) {
      return
    }

    try {
      const response = await fetch(`/api/admin/menu/${id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error("Failed to delete menu item")
      }

      setMenuItems(menuItems.filter((item) => item._id !== id))

      toast({
        title: "Success",
        description: "Menu item deleted successfully",
      })
    } catch (error) {
      console.error("Error deleting menu item:", error)
      toast({
        title: "Error",
        description: "Failed to delete menu item. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleToggleAvailability = async (id: string, available: boolean) => {
    try {
      setUpdatingAvailability(id)

      const item = menuItems.find((item) => item._id === id)
      if (!item) return

      const response = await fetch(`/api/admin/menu/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ ...item, available }),
      })

      if (!response.ok) {
        throw new Error("Failed to update menu item")
      }

      setMenuItems(menuItems.map((item) => (item._id === id ? { ...item, available } : item)))

      toast({
        title: "Success",
        description: `Item ${available ? "enabled" : "disabled"} successfully`,
      })
    } catch (error) {
      console.error("Error updating availability:", error)
      toast({
        title: "Error",
        description: "Failed to update availability. Please try again.",
        variant: "destructive",
      })
    } finally {
      setUpdatingAvailability(null)
    }
  }

  if (loading) {
    return <div className="text-center py-8">Loading menu items...</div>
  }

  return (
    <div>
      <div className="flex justify-end mb-4">
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <PlusIcon className="mr-2 h-4 w-4" />
              Add Item
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Add Menu Item</DialogTitle>
              <DialogDescription>Add a new item to your menu. Click save when you're done.</DialogDescription>
            </DialogHeader>
            <MenuItemForm onSubmit={handleAddItem} onCancel={() => setIsAddDialogOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Available</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {menuItems.map((item) => (
              <TableRow key={item._id}>
                <TableCell className="font-medium">{item.name}</TableCell>
                <TableCell className="max-w-xs truncate">{item.description}</TableCell>
                <TableCell>₹{item.price.toFixed(2)}</TableCell>
                <TableCell>
                  <Badge variant="outline">{item.category}</Badge>
                </TableCell>
                <TableCell>
                  <Switch
                    checked={item.available}
                    onCheckedChange={(checked) => handleToggleAvailability(item._id, checked)}
                    disabled={updatingAvailability === item._id}
                  />
                </TableCell>
                <TableCell>
                  <div className="flex space-x-2">
                    <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="icon" onClick={() => setSelectedItem(item)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      {selectedItem && selectedItem._id === item._id && (
                        <DialogContent className="sm:max-w-[600px]">
                          <DialogHeader>
                            <DialogTitle>Edit Menu Item</DialogTitle>
                            <DialogDescription>
                              Make changes to the menu item. Click save when you're done.
                            </DialogDescription>
                          </DialogHeader>
                          <MenuItemForm
                            initialData={selectedItem}
                            onSubmit={handleEditItem}
                            onCancel={() => {
                              setIsEditDialogOpen(false)
                              setSelectedItem(null)
                            }}
                          />
                        </DialogContent>
                      )}
                    </Dialog>
                    <Button variant="outline" size="icon" onClick={() => handleDeleteItem(item._id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}

