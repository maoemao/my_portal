'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { Spin, message } from 'antd'
import type { System } from '@prisma/client'

function fetchSystems(): Promise<System[]> {
  return fetch('/api/systems').then(res => res.json())
}

function fetchToken(systemCode: string): Promise<{ token: string }> {
  return fetch(`/api/tokens/${systemCode}`).then(res => res.json())
}

export default function MicroAppPage() {
  const { systemCode } = useParams<{ systemCode: string }>()
  const router = useRouter()
  const [token, setToken] = useState('')
  const [loading, setLoading] = useState(true)

  const { data: systems } = useQuery({
    queryKey: ['systems'],
    queryFn: fetchSystems,
  })

  const currentSystem = systems?.find(s => s.code === systemCode)

  useEffect(() => {
    if (!currentSystem) {
      message.error('子系统不存在')
      router.push('/')
      return
    }

    const loadToken = async () => {
      try {
        const data = await fetchToken(systemCode)
        setToken(data.token)
        
        if ((window as any).__POWERED_BY_QIANKUN__) {
          const actions = (window as any).__QIANKUN_GLOBAL_STATE_ACTIONS__
          if (actions) {
            actions.setGlobalState({ token: data.token })
          }
        }
      } catch {
        message.error('获取Token失败')
      } finally {
        setLoading(false)
      }
    }

    loadToken()
  }, [systemCode, currentSystem, router])

  useEffect(() => {
    if (typeof window === 'undefined') return
    const startQiankun = async () => {
      const { start } = await import('qiankun')
      start()
    }
    startQiankun()
  }, [])

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
        <Spin size="large" />
      </div>
    )
  }

  return (
    <div id="micro-app-container" style={{ width: '100%', height: 'calc(100vh - 112px)' }} />
  )
}
