'use client'

import { useEffect, useState } from 'react'
import { Layout, Menu, Avatar, Dropdown, message } from 'antd'
import type { MenuProps } from 'antd'
import {
  HomeOutlined,
  UserOutlined,
  AppstoreOutlined,
  LogoutOutlined,
  SettingOutlined,
} from '@ant-design/icons'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { setupQiankun } from '@/lib/qiankun'
import type { System } from '@prisma/client'

const { Header, Sider, Content } = Layout

function fetchSystems(): Promise<System[]> {
  return fetch('/api/systems').then(res => res.json())
}

function fetchUserInfo(): Promise<{ name: string; avatar?: string; role: string }> {
  return fetch('/api/users/me').then(res => res.json())
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [systems, setSystems] = useState<System[]>([])
  const router = useRouter()

  const { data: userInfo } = useQuery({
    queryKey: ['userInfo'],
    queryFn: fetchUserInfo,
  })

  const { data: systemsData } = useQuery({
    queryKey: ['systems'],
    queryFn: fetchSystems,
  })

  useEffect(() => {
    if (systemsData && userInfo) {
      setSystems(systemsData)
      setupQiankun(systemsData, userInfo)
    }
  }, [systemsData, userInfo])

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    message.success('已退出登录')
    router.push('/login')
  }

  const userMenuItems: MenuProps['items'] = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: <Link href="/profile">个人中心</Link>,
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: '退出登录',
      onClick: handleLogout,
    },
  ]

  const menuItems: MenuProps['items'] = [
    {
      key: '/',
      icon: <HomeOutlined />,
      label: <Link href="/">首页</Link>,
    },
    ...systems.map(system => ({
      key: `/app/${system.code}`,
      icon: <AppstoreOutlined />,
      label: <Link href={`/app/${system.code}`}>{system.name}</Link>,
    })),
    { type: 'divider' },
    {
      key: '/profile',
      icon: <UserOutlined />,
      label: <Link href="/profile">个人中心</Link>,
    },
  ]

  if (userInfo?.role === 'ADMIN') {
    menuItems.push({
      key: '/systems',
      icon: <SettingOutlined />,
      label: <Link href="/systems">子系统管理</Link>,
    })
  }

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider
        width={256}
        style={{ background: '#001529' }}
      >
        <div style={{ padding: '16px', color: '#fff', fontSize: '20px', fontWeight: 'bold' }}>
          Portal系统
        </div>
        <Menu
          mode="inline"
          theme="dark"
          defaultSelectedKeys={['/']}
          items={menuItems}
        />
      </Sider>
      <Layout>
        <Header style={{ padding: '0 24px', display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
          <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
            <div style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', color: '#fff' }}>
              <Avatar icon={<UserOutlined />} src={userInfo?.avatar} />
              <span style={{ marginLeft: '8px' }}>{userInfo?.name}</span>
            </div>
          </Dropdown>
        </Header>
        <Content style={{ padding: '24px', background: '#f0f2f5', minHeight: 'calc(100vh - 64px)' }}>
          {children}
        </Content>
      </Layout>
    </Layout>
  )
}
