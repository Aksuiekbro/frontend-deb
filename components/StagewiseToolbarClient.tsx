'use client'

import dynamic from 'next/dynamic'

const StagewiseToolbar = dynamic(
  () => import('@stagewise/toolbar-next').then(mod => ({ default: mod.StagewiseToolbar })),
  { ssr: false }
)

interface StagewiseToolbarClientProps {
  config: {
    plugins: any[]
  }
}

export default function StagewiseToolbarClient({ config }: StagewiseToolbarClientProps) {
  return <StagewiseToolbar config={config} />
}