"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { AdminNav } from "@/components/admin-nav"
import { AdminSidebar } from "@/components/admin-sidebar"
import { useToast } from "@/hooks/use-toast"
import type { Admin } from "@/lib/types"

export default function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const { toast } = useToast()
  const [admin, setAdmin] = useState<Admin | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function checkAdminAuth() {
      try {
        const response = await fetch("/api/admin/me")
        if (!response.ok) {
          throw new Error("Not authenticated")
        }

        const data = await response.json()
        setAdmin(data.admin)
      } catch (error) {
        toast({
          variant: "destructive",
          title: "Authentication required",
          description: "Please login to access the admin dashboard",
        })
        router.push("/admin/login")
      } finally {
        setIsLoading(false)
      }
    }

    checkAdminAuth()
  }, [router, toast])

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    )
  }

  if (!admin) {
    return null
  }

  return (
    <div className="flex min-h-screen flex-col">
      <AdminNav admin={admin} />
      <div className="flex flex-1">
        <AdminSidebar />
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  )
}

