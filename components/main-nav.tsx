import Link from "next/link"
import { ShoppingBag, Home, Clock } from "lucide-react"

export function MainNav() {
  return (
    <div className="flex items-center gap-6 md:gap-10">
      <Link href="/dashboard" className="flex items-center gap-2 font-bold text-xl">
        <span className="text-primary">SVCE</span> Cafeteria
      </Link>
      <nav className="flex items-center gap-6">
        <Link
          href="/dashboard"
          className="text-sm font-medium transition-colors hover:text-primary flex items-center gap-1"
        >
          <Home className="h-4 w-4" />
          <span className="hidden md:inline">Dashboard</span>
        </Link>
        <Link href="/menu" className="text-sm font-medium transition-colors hover:text-primary flex items-center gap-1">
          <ShoppingBag className="h-4 w-4" />
          <span className="hidden md:inline">Menu</span>
        </Link>
        <Link
          href="/orders/history"
          className="text-sm font-medium transition-colors hover:text-primary flex items-center gap-1"
        >
          <Clock className="h-4 w-4" />
          <span className="hidden md:inline">Orders</span>
        </Link>
      </nav>
    </div>
  )
}

