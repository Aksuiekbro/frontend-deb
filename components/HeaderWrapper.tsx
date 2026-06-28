"use client"

import { usePathname } from "next/navigation"
import Header from "./Header"

const HIDDEN_PATHS = ["/auth"]

export default function HeaderWrapper() {
  const pathname = usePathname()
  if (HIDDEN_PATHS.some((p) => pathname.startsWith(p))) return null
  return <Header />
}
