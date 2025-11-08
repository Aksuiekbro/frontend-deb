"use client"

import React from "react"
import { LogOut } from "lucide-react"
import { api } from "@/lib/api"

export default function LogoutButton() {
  const [loading, setLoading] = React.useState(false)

  async function onLogout() {
    if (loading) return
    setLoading(true)
    try {
      await api.logout().catch(() => undefined)
    } finally {
      // Always reload the page to refresh SWR/session state
      if (typeof window !== "undefined") window.location.reload()
    }
  }

  return (
    <button type="button" onClick={onLogout} disabled={loading} className="flex items-center gap-2 text-[#0D1321] hover:opacity-80 disabled:opacity-50">
      <LogOut className="h-5 w-5" />
      <span className="text-[18px]">{loading ? "Logging out..." : "Log out"}</span>
    </button>
  )
}


