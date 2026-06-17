'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Card, Form, Input, Button, Avatar, message, Typography, Row, Col } from 'antd'
import { UserOutlined } from '@ant-design/icons'

const { Title } = Typography

interface UserInfo {
  id: string
  email: string
  name: string
  avatar?: string
  role: string
  createdAt: string
}

function fetchUserInfo(): Promise<UserInfo> {
  return fetch('/api/users/me').then(res => res.json())
}

export default function ProfilePage() {
  const [form] = Form.useForm()
  const [isEditing, setIsEditing] = useState(false)
  const queryClient = useQueryClient()

  const { data: userInfo } = useQuery({
    queryKey: ['userInfo'],
    queryFn: fetchUserInfo,
  })

  const updateProfile = useMutation({
    mutationFn: (data: { name: string; avatar?: string }) =>
      fetch('/api/users/me', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }).then(res => res.json()),
    onSuccess: () => {
      message.success('更新成功')
      queryClient.invalidateQueries({ queryKey: ['userInfo'] })
      setIsEditing(false)
    },
    onError: () => {
      message.error('更新失败')
    },
  })

  const handleSubmit = () => {
    form.validateFields().then(values => {
      updateProfile.mutate(values)
    })
  }

  const roleText = userInfo?.role === 'ADMIN' ? '管理员' : '普通用户'

  return (
    <Card>
      <Title level={2}>个人中心</Title>

      <Row gutter={[24, 24]}>
        <Col span={8}>
          <div style={{ textAlign: 'center', padding: '24px' }}>
            <Avatar size={128} icon={<UserOutlined />} src={userInfo?.avatar} />
            <Title level={4} style={{ marginTop: '16px', marginBottom: 0 }}>
              {userInfo?.name}
            </Title>
            <p style={{ color: '#999', marginTop: '8px' }}>{roleText}</p>
          </div>
        </Col>

        <Col span={16}>
          <Form
            form={form}
            layout="vertical"
            initialValues={userInfo}
            disabled={!isEditing}
          >
            <Form.Item name="email" label="邮箱">
              <Input disabled />
            </Form.Item>

            <Form.Item name="name" label="姓名" rules={[{ required: true }]}>
              <Input placeholder="请输入姓名" />
            </Form.Item>

            <Form.Item name="avatar" label="头像URL">
              <Input placeholder="请输入头像URL" />
            </Form.Item>

            <Form.Item label="注册时间">
              <span>{userInfo?.createdAt ? new Date(userInfo.createdAt).toLocaleDateString() : '-'}</span>
            </Form.Item>

            <Form.Item>
              {isEditing ? (
                <>
                  <Button type="primary" onClick={handleSubmit} style={{ marginRight: '8px' }}>
                    保存
                  </Button>
                  <Button onClick={() => {
                    setIsEditing(false)
                    form.setFieldsValue(userInfo)
                  }}>
                    取消
                  </Button>
                </>
              ) : (
                <Button type="primary" onClick={() => setIsEditing(true)}>
                  编辑资料
                </Button>
              )}
            </Form.Item>
          </Form>
        </Col>
      </Row>
    </Card>
  )
}
