import type { Metadata } from 'next'
import Providers from './providers'

export const metadata: Metadata = {
  title: 'Portal系统',
  description: '统一认证与子系统管理门户',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-CN">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
