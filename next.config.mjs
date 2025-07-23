/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  onDemandEntries: {
    maxInactiveAge: 25 * 1000,
    pagesBufferLength: 2,
  },
  webpack: (config, { dev, isServer }) => {
    if (dev && !isServer) {
      const originalEntry = config.entry
      config.entry = async () => {
        const entries = await originalEntry()
        
        if (entries['main.js'] && !entries['main.js'].includes('./client/dev-warning-filter.js')) {
          entries['main.js'].unshift('./client/dev-warning-filter.js')
        }
        
        return entries
      }
    }
    return config
  },
}

export default nextConfig
