import type React from "react"
import type { Metadata } from "next"
import { Inter, Cinzel } from "next/font/google"
import "./globals.css"
import StagewiseToolbarClient from '../components/StagewiseToolbarClient'
import SWRProvider from '../components/providers/swr-provider'
import HeaderWrapper from '../components/HeaderWrapper'
import { Toaster } from '../components/ui/toaster'

const inter = Inter({ subsets: ["latin"] })
const cinzel = Cinzel({ subsets: ["latin"], weight: ["600", "700"], variable: "--font-cinzel" })

// Runs before hydration so the Senate/Classic theme is correct on first
// paint (no flash of the wrong theme). Kept as a plain string so it can sit
// inline in <head> — see design-reference/senate/senate-theme-implementation-brief.md §3.
const THEME_INIT_SCRIPT = `
(function () {
  try {
    var stored = window.localStorage.getItem('debetter-theme');
    document.documentElement.setAttribute('data-theme', stored === 'senate' ? 'senate' : 'classic');
  } catch (e) {
    document.documentElement.setAttribute('data-theme', 'classic');
  }
})();
`

export const metadata: Metadata = {
  title: "Color Palette Showcase",
  description: "A showcase of color palettes and schemes",
  generator: 'v0.dev',
  icons: {
    icon: "/the-talking-logo.png",
    shortcut: "/the-talking-logo.png",
  },
}

const stagewiseConfig = {
  plugins: []
};


export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body className={`${inter.className} ${cinzel.variable} font-hikasami`}>
        <SWRProvider>
          <HeaderWrapper />
          {children}
        </SWRProvider>
        <Toaster />
        {process.env.NODE_ENV === 'development' && process.env.NEXT_PUBLIC_INTEGRITY_LOCAL_ONLY !== '1' && (
          <StagewiseToolbarClient config={stagewiseConfig} />
        )}
      </body>
    </html>
  )
}
