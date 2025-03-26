"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ScrollText, ShoppingBag, LayoutDashboard, Settings } from "lucide-react"

export function AdminSidebar() {
  const pathname = usePathname()

  const routes = [
    {
      href: "/admin/dashboard",
      icon: LayoutDashboard,
      title: "Dashboard",
    },
    {
      href: "/admin/orders",
      icon: ScrollText,
      title: "Orders",
    },
    {
      href: "/admin/menu",
      icon: ShoppingBag,
      title: "Menu",
    },
    {
      href: "/admin/settings",
      icon: Settings,
      title: "Settings",
    },
  ]

  return (
    <div className="hidden border-r bg-muted/40 md:block md:w-64">
      <div className="flex h-full flex-col gap-2 p-4">
        <div className="flex flex-col gap-1">
          {routes.map((route) => (
            <Link key={route.href} href={route.href}>
              <Button
                variant="ghost"
                className={cn("w-full justify-start gap-2", pathname === route.href && "bg-muted")}
              >
                <route.icon className="h-4 w-4" />
                {route.title}
              </Button>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}

