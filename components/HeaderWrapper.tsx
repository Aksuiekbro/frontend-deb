"use client"

import { usePathname } from "next/navigation"
import Header from "./Header"

export default function HeaderWrapper() {
  const pathname = usePathname()
  return <Header pathname={pathname} hideAuthActions={pathname.startsWith("/auth")} />
}
