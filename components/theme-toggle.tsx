"use client"

import { useEffect, useRef, useState } from "react"

const THEME_KEY = "debetter-theme"
type Theme = "classic" | "senate"

// Matches design-reference/senate/assets/theme.css `.theme-toggle` markup
// and design-reference/senate/assets/app.js behavior exactly.
export default function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>("classic")
  const [thumbX, setThumbX] = useState(74)
  const senateRef = useRef<HTMLSpanElement>(null)
  const toggleRef = useRef<HTMLDivElement>(null)

  const sizeThumb = () => {
    const target = senateRef.current
    if (target) setThumbX(target.offsetLeft - 3)
  }

  useEffect(() => {
    // The anti-FOUC script in app/layout.tsx already set data-theme on
    // <html> before hydration — read it back so this component matches
    // what's actually on screen instead of guessing "classic".
    const current = document.documentElement.getAttribute("data-theme")
    setTheme(current === "senate" ? "senate" : "classic")
  }, [])

  useEffect(() => {
    sizeThumb()
    window.addEventListener("resize", sizeThumb)
    return () => window.removeEventListener("resize", sizeThumb)
  }, [theme])

  const toggle = () => {
    const next: Theme = theme === "senate" ? "classic" : "senate"
    document.documentElement.setAttribute("data-theme", next)
    try {
      window.localStorage.setItem(THEME_KEY, next)
    } catch {
      // localStorage unavailable (private mode, disabled) — theme still
      // applies for this page view, just doesn't persist.
    }
    setTheme(next)
  }

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault()
      toggle()
    }
  }

  return (
    <div
      ref={toggleRef}
      className="db-theme-toggle"
      data-active={theme}
      role="switch"
      aria-checked={theme === "senate"}
      aria-label="Switch theme"
      tabIndex={0}
      onClick={toggle}
      onKeyDown={onKeyDown}
      style={{ ["--db-thumb-x" as string]: `${thumbX}px` }}
    >
      <span className="db-theme-toggle__thumb" />
      <span className="db-theme-toggle__option" data-value="classic">Classic</span>
      <span ref={senateRef} className="db-theme-toggle__option" data-value="senate">Senate</span>
    </div>
  )
}
