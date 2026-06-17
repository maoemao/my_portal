'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Form, Input, Button, Card, message } from 'antd'
import { LockOutlined, UserOutlined } from '@ant-design/icons'

export default function LoginPage() {
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (values: { email: string; password: string }) => {
    setLoading(true)
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      })

      if (response.ok) {
        message.success('登录成功')
        router.push('/')
      } else {
        const data = await response.json()
        message.error(data.error || '登录失败')
      }
    } catch {
      message.error('登录失败')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card
      title={<h2 style={{ textAlign: 'center', margin: 0 }}>欢迎登录 Portal系统</h2>}
      style={{ width: 400, boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}
    >
      <Form
        form={form}
        name="login"
        onFinish={handleSubmit}
        layout="vertical"
      >
        <Form.Item
          name="email"
          label="邮箱"
          rules={[
            { required: true, message: '请输入邮箱' },
            { type: 'email', message: '请输入有效的邮箱' },
          ]}
        >
          <Input prefix={<UserOutlined />} placeholder="请输入邮箱" />
        </Form.Item>

        <Form.Item
          name="password"
          label="密码"
          rules={[{ required: true, message: '请输入密码' }]}
        >
          <Input.Password prefix={<LockOutlined />} placeholder="请输入密码" />
        </Form.Item>

        <Form.Item>
          <Button
            type="primary"
            htmlType="submit"
            loading={loading}
            style={{ width: '100%' }}
          >
            登录
          </Button>
        </Form.Item>

        <div style={{ textAlign: 'center' }}>
          <a href="/register">还没有账号？立即注册</a>
        </div>
      </Form>
    </Card>
  )
}
