"use client"

import { Switch } from "@/components/ui/switch"

import { FormDescription } from "@/components/ui/form"

import { useEffect, useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Edit, Plus, Trash2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import type { MenuItem } from "@/lib/types"
import { Label } from "@/components/ui/label"

const menuItemFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().min(1, "Description is required"),
  price: z.coerce.number().min(0.01, "Price must be greater than 0"),
  category: z.string().min(1, "Category is required"),
  available: z.boolean().default(true),
})

export default function AdminMenuPage() {
  const { toast } = useToast()
  const [menuItems, setMenuItems] = useState<MenuItem[]>([])
  const [categories, setCategories] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null)
  const [newCategory, setNewCategory] = useState("")
  const [isAddingCategory, setIsAddingCategory] = useState(false)
  const [newItem, setNewItem] = useState<MenuItem>({
    name: "",
    description: "",
    price: 0,
    category: "",
    available: true,
  })

  const addForm = useForm<z.infer<typeof menuItemFormSchema>>({
    resolver: zodResolver(menuItemFormSchema),
    defaultValues: {
      name: "",
      description: "",
      price: 0,
      category: "",
      available: true,
    },
  })

  const editForm = useForm<z.infer<typeof menuItemFormSchema>>({
    resolver: zodResolver(menuItemFormSchema),
    defaultValues: {
      name: "",
      description: "",
      price: 0,
      category: "",
      available: true,
    },
  })

  useEffect(() => {
    async function fetchMenu() {
      try {
        const response = await fetch("/api/admin/menu")
        if (!response.ok) throw new Error("Failed to fetch menu")

        const data = await response.json()
        setMenuItems(data.menuItems)

        // Extract unique categories
        const uniqueCategories = Array.from(new Set(data.menuItems.map((item: MenuItem) => item.category)))
        setCategories(uniqueCategories)
      } catch (error) {
        console.error("Error fetching menu:", error)
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load menu. Please try again.",
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchMenu()
  }, [toast])

  const handleAddMenuItem = async (values: z.infer<typeof menuItemFormSchema>) => {
    try {
      const response = await fetch("/api/admin/menu", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(values),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || "Failed to add menu item")
      }

      const data = await response.json()

      // Update the menu items list
      setMenuItems([...menuItems, data.menuItem])

      // Add the category if it's new
      if (!categories.includes(values.category)) {
        setCategories([...categories, values.category])
      }

      toast({
        title: "Menu item added",
        description: "The menu item has been added successfully.",
      })

      // Reset form and close dialog
      addForm.reset()
      setIsAddDialogOpen(false)
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Failed to add menu item",
        description: error instanceof Error ? error.message : "Something went wrong",
      })
    }
  }

  const handleEditMenuItem = async (values: z.infer<typeof menuItemFormSchema>) => {
    if (!selectedItem) return

    try {
      const response = await fetch(`/api/admin/menu/${selectedItem._id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(values),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || "Failed to update menu item")
      }

      const data = await response.json()

      // Update the menu items list
      setMenuItems(menuItems.map((item) => (item._id === selectedItem._id ? data.menuItem : item)))

      // Add the category if it's new
      if (!categories.includes(values.category)) {
        setCategories([...categories, values.category])
      }

      toast({
        title: "Menu item updated",
        description: "The menu item has been updated successfully.",
      })

      // Reset form and close dialog
      editForm.reset()
      setSelectedItem(null)
      setIsEditDialogOpen(false)
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Failed to update menu item",
        description: error instanceof Error ? error.message : "Something went wrong",
      })
    }
  }

  const handleDeleteMenuItem = async (itemId: string) => {
    if (!confirm("Are you sure you want to delete this menu item?")) return

    try {
      const response = await fetch(`/api/admin/menu/${itemId}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || "Failed to delete menu item")
      }

      // Update the menu items list
      setMenuItems(menuItems.filter((item) => item._id !== itemId))

      toast({
        title: "Menu item deleted",
        description: "The menu item has been deleted successfully.",
      })
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Failed to delete menu item",
        description: error instanceof Error ? error.message : "Something went wrong",
      })
    }
  }

  const handleAddCategory = () => {
    if (!newCategory.trim()) {
      toast({
        variant: "destructive",
        title: "Invalid category",
        description: "Please enter a valid category name.",
      })
      return
    }

    if (categories.includes(newCategory.trim())) {
      toast({
        variant: "destructive",
        title: "Category exists",
        description: "This category already exists.",
      })
      return
    }

    setCategories([...categories, newCategory.trim()])
    setNewCategory("")
    setIsAddingCategory(false)

    toast({
      title: "Category added",
      description: "The category has been added successfully.",
    })
  }

  const openEditDialog = (item: MenuItem) => {
    setSelectedItem(item)
    editForm.reset({
      name: item.name,
      description: item.description,
      price: item.price,
      category: item.category,
      available: item.available,
    })
    setIsEditDialogOpen(true)
  }

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    handleAddMenuItem(newItem)
  }

  if (isLoading) {
    return (
      <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Menu Management</h2>
          <p className="text-muted-foreground">Add, edit, or remove items from the cafeteria menu.</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Menu Item
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Add Menu Item</DialogTitle>
              <DialogDescription>Add a new item to the cafeteria menu.</DialogDescription>
            </DialogHeader>
            <Form {...addForm}>
              <form onSubmit={handleAddSubmit} className="space-y-4">
                <FormField
                  control={addForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Chicken Biryani" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={addForm.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Fragrant basmati rice cooked with tender chicken pieces and aromatic spices."
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={addForm.control}
                  name="price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Price (₹)</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.01" min="0" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={addForm.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category</FormLabel>
                      <div className="flex gap-2">
                        {isAddingCategory ? (
                          <div className="flex gap-2 w-full">
                            <Input
                              value={newCategory}
                              onChange={(e) => setNewCategory(e.target.value)}
                              placeholder="New category"
                              className="flex-1"
                            />
                            <Button type="button" onClick={handleAddCategory}>
                              Add
                            </Button>
                            <Button type="button" variant="ghost" onClick={() => setIsAddingCategory(false)}>
                              Cancel
                            </Button>
                          </div>
                        ) : (
                          <>
                            <FormControl>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <SelectTrigger className="w-full">
                                  <SelectValue placeholder="Select a category" />
                                </SelectTrigger>
                                <SelectContent>
                                  {categories.map((category) => (
                                    <SelectItem key={category} value={category}>
                                      {category}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </FormControl>
                            <Button type="button" variant="outline" onClick={() => setIsAddingCategory(true)}>
                              New
                            </Button>
                          </>
                        )}
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={addForm.control}
                  name="available"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                      <div className="space-y-0.5">
                        <FormLabel>Available</FormLabel>
                        <FormDescription>Mark this item as available on the menu</FormDescription>
                      </div>
                      <FormControl>
                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <DialogFooter>
                  <Button type="submit">Add Item</Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {menuItems.map((item) => (
          <Card key={item._id}>
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle>{item.name}</CardTitle>
                  <CardDescription>{item.description}</CardDescription>
                </div>
                <Badge variant={item.available ? "default" : "secondary"}>
                  {item.available ? "Available" : "Unavailable"}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between items-center">
                <Badge variant="outline">{item.category}</Badge>
                <p className="text-lg font-bold">₹{item.price.toFixed(2)}</p>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" onClick={() => openEditDialog(item)}>
                    <Edit className="mr-2 h-4 w-4" />
                    Edit
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                  <DialogHeader>
                    <DialogTitle>Edit Menu Item</DialogTitle>
                    <DialogDescription>Make changes to the menu item.</DialogDescription>
                  </DialogHeader>
                  <Form {...editForm}>
                    <form onSubmit={editForm.handleSubmit(handleEditMenuItem)} className="space-y-4">
                      <FormField
                        control={editForm.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Name</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={editForm.control}
                        name="description"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Description</FormLabel>
                            <FormControl>
                              <Textarea {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={editForm.control}
                        name="price"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Price (₹)</FormLabel>
                            <FormControl>
                              <Input type="number" step="0.01" min="0" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={editForm.control}
                        name="category"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Category</FormLabel>
                            <div className="flex gap-2">
                              {isAddingCategory ? (
                                <div className="flex gap-2 w-full">
                                  <Input
                                    value={newCategory}
                                    onChange={(e) => setNewCategory(e.target.value)}
                                    placeholder="New category"
                                    className="flex-1"
                                  />
                                  <Button type="button" onClick={handleAddCategory}>
                                    Add
                                  </Button>
                                  <Button type="button" variant="ghost" onClick={() => setIsAddingCategory(false)}>
                                    Cancel
                                  </Button>
                                </div>
                              ) : (
                                <>
                                  <FormControl>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                      <SelectTrigger className="w-full">
                                        <SelectValue placeholder="Select a category" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        {categories.map((category) => (
                                          <SelectItem key={category} value={category}>
                                            {category}
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                  </FormControl>
                                  <Button type="button" variant="outline" onClick={() => setIsAddingCategory(true)}>
                                    New
                                  </Button>
                                </>
                              )}
                            </div>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={editForm.control}
                        name="available"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                            <div className="space-y-0.5">
                              <FormLabel>Available</FormLabel>
                              <FormDescription>Mark this item as available on the menu</FormDescription>
                            </div>
                            <FormControl>
                              <Switch checked={field.value} onCheckedChange={field.onChange} />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      <DialogFooter>
                        <Button type="submit">Save Changes</Button>
                      </DialogFooter>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
              <Button variant="ghost" className="text-destructive" onClick={() => handleDeleteMenuItem(item._id)}>
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>

      {menuItems.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground mb-4">No menu items found. Add your first menu item to get started.</p>
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Menu Item
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Menu Item</DialogTitle>
                  <DialogDescription>
                    Add a new menu item to your cafeteria menu.
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleAddSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Name</Label>
                    <Input
                      id="name"
                      value={newItem.name}
                      onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={newItem.description}
                      onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="price">Price</Label>
                    <Input
                      id="price"
                      type="number"
                      value={newItem.price}
                      onChange={(e) => setNewItem({ ...newItem, price: parseFloat(e.target.value) })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="category">Category</Label>
                    <Select value={newItem.category} onValueChange={(value) => setNewItem({ ...newItem, category: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="breakfast">Breakfast</SelectItem>
                        <SelectItem value="lunch">Lunch</SelectItem>
                        <SelectItem value="dinner">Dinner</SelectItem>
                        <SelectItem value="snacks">Snacks</SelectItem>
                        <SelectItem value="beverages">Beverages</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="image">Image URL</Label>
                    <Input
                      id="image"
                      value={newItem.image}
                      onChange={(e) => setNewItem({ ...newItem, image: e.target.value })}
                    />
                  </div>
                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit">Add Item</Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

