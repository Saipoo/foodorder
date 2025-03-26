"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { useRouter } from "next/navigation"

interface Admin {
  _id: string
  name: string
  email: string
  role: string
}

interface AdminAuthContextType {
  admin: Admin | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (name: string, email: string, password: string) => Promise<void>
  logout: () => Promise<void>
}

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined)

export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const [admin, setAdmin] = useState<Admin | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  // Check if admin is logged in on initial render
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch("/api/admin/me")
        if (response.ok) {
          const data = await response.json()
          setAdmin(data.admin)
        }
      } catch (error) {
        console.error("Error checking admin auth:", error)
      } finally {
        setLoading(false)
      }
    }

    checkAuth()
  }, [])

  const login = async (email: string, password: string) => {
    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.message || "Login failed")
      }

      const data = await response.json()
      setAdmin(data.admin)
      router.push("/admin/dashboard")
    } catch (error) {
      console.error("Admin login error:", error)
      throw error
    }
  }

  const register = async (name: string, email: string, password: string) => {
    try {
      const response = await fetch("/api/admin/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name, email, password }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.message || "Registration failed")
      }

      // After successful registration, log in automatically
      await login(email, password)
    } catch (error) {
      console.error("Admin registration error:", error)
      throw error
    }
  }

  const logout = async () => {
    try {
      await fetch("/api/admin/logout", {
        method: "POST",
      })
      setAdmin(null)
      router.push("/admin/login")
    } catch (error) {
      console.error("Admin logout error:", error)
      throw error
    }
  }

  return (
    <AdminAuthContext.Provider
      value={{
        admin,
        loading,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AdminAuthContext.Provider>
  )
}

export function useAdminAuth() {
  const context = useContext(AdminAuthContext)
  if (context === undefined) {
    throw new Error("useAdminAuth must be used within an AdminAuthProvider")
  }
  return context
}

