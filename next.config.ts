import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  output: 'standalone',
  reactStrictMode: true,
  transpilePackages: ['qiankun'],
  experimental: {
    optimizePackageImports: ['antd'],
  },
}

export default nextConfig
