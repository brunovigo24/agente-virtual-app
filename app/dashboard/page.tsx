"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Dashboard from "@/components/dashboard"
import jwt_decode from "jwt-decode"

export default function DashboardPage() {
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    // Check if user is authenticated and token is valid
    const token = localStorage.getItem("authToken")
    if (!token) {
      router.push("/login")
      return
    }
    try {
      const decoded: any = jwt_decode(token)
      // JWT padrão: exp é timestamp em segundos
      if (!decoded.exp || Date.now() >= decoded.exp * 1000) {
        localStorage.removeItem("authToken")
        router.push("/login")
        return
      }
      setIsLoading(false)
    } catch (e) {
      // Token inválido
      localStorage.removeItem("authToken")
      router.push("/login")
    }
  }, [router])

  if (isLoading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-[#0f172a]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white"></div>
      </div>
    )
  }

  return <Dashboard />
}
