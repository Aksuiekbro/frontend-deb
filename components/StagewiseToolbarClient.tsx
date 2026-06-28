'use client'

import dynamic from 'next/dynamic'
import type { ToolbarConfig } from '@stagewise/toolbar-next'

const StagewiseToolbar = dynamic(
  () => import('@stagewise/toolbar-next').then(mod => ({ default: mod.StagewiseToolbar })),
  { ssr: false }
)

interface StagewiseToolbarClientProps {
  config: ToolbarConfig
}

export default function StagewiseToolbarClient({ config }: StagewiseToolbarClientProps) {
  return <StagewiseToolbar config={config} />
}
