'use client'

import { useState } from 'react'
import {
  Table,
  Button,
  Modal,
  Form,
  Input,
  Switch,
  Tag,
  Space,
  message,
} from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

interface OAuthClient {
  id: string
  clientId: string
  name: string
  redirectUris: string[]
  scopes: string[]
  isActive: boolean
  createdAt: string
}

async function fetchClients(): Promise<OAuthClient[]> {
  const res = await fetch('/api/oauth/clients')
  if (!res.ok) throw new Error('获取客户端列表失败')
  return res.json()
}

async function createClient(data: {
  name: string
  redirectUris: string
  scopes: string
}) {
  const res = await fetch('/api/oauth/clients', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: data.name,
      redirectUris: data.redirectUris.split('\n').filter(Boolean),
      scopes: data.scopes.split('\n').filter(Boolean),
    }),
  })
  if (!res.ok) throw new Error('创建客户端失败')
  return res.json()
}

async function updateClient(id: string, data: {
  name: string
  redirectUris: string
  scopes: string
  isActive: boolean
}) {
  const res = await fetch(`/api/oauth/clients/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: data.name,
      redirectUris: data.redirectUris.split('\n').filter(Boolean),
      scopes: data.scopes.split('\n').filter(Boolean),
      isActive: data.isActive,
    }),
  })
  if (!res.ok) throw new Error('更新客户端失败')
  return res.json()
}

async function deleteClient(id: string) {
  const res = await fetch(`/api/oauth/clients/${id}`, {
    method: 'DELETE',
  })
  if (!res.ok) throw new Error('删除客户端失败')
  return res.json()
}

export default function OAuthClientsPage() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingClient, setEditingClient] = useState<OAuthClient | null>(null)
  const [form] = Form.useForm()

  const queryClient = useQueryClient()

  const { data: clients, isLoading } = useQuery({
    queryKey: ['oauth-clients'],
    queryFn: fetchClients,
  })

  const createMutation = useMutation({
    mutationFn: createClient,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['oauth-clients'] })
      setIsModalOpen(false)
      form.resetFields()
      message.success('客户端创建成功')
    },
    onError: () => {
      message.error('创建失败')
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: typeof form }) => updateClient(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['oauth-clients'] })
      setIsModalOpen(false)
      setEditingClient(null)
      form.resetFields()
      message.success('客户端更新成功')
    },
    onError: () => {
      message.error('更新失败')
    },
  })

  const deleteMutation = useMutation({
    mutationFn: deleteClient,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['oauth-clients'] })
      message.success('客户端删除成功')
    },
    onError: () => {
      message.error('删除失败')
    },
  })

  const handleAdd = () => {
    setEditingClient(null)
    form.resetFields()
    setIsModalOpen(true)
  }

  const handleEdit = (client: OAuthClient) => {
    setEditingClient(client)
    form.setFieldsValue({
      name: client.name,
      redirectUris: client.redirectUris.join('\n'),
      scopes: client.scopes.join('\n'),
      isActive: client.isActive,
    })
    setIsModalOpen(true)
  }

  const handleDelete = (id: string) => {
    Modal.confirm({
      title: '确认删除',
      content: '删除后将无法恢复，确定继续吗？',
      onOk: () => deleteMutation.mutate(id),
    })
  }

  const handleSubmit = () => {
    form.validateFields().then((values) => {
      if (editingClient) {
        updateMutation.mutate({ id: editingClient.id, data: values })
      } else {
        createMutation.mutate(values)
      }
    })
  }

  const columns = [
    {
      title: '名称',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: '客户端ID',
      dataIndex: 'clientId',
      key: 'clientId',
      ellipsis: true,
    },
    {
      title: '回调地址',
      dataIndex: 'redirectUris',
      key: 'redirectUris',
      render: (uris: string[]) => (
        <div>
          {uris.map((uri, idx) => (
            <div key={idx} className="text-sm text-gray-500">
              {uri}
            </div>
          ))}
        </div>
      ),
    },
    {
      title: '权限范围',
      dataIndex: 'scopes',
      key: 'scopes',
      render: (scopes: string[]) => (
        <Space>
          {scopes.map((scope) => (
            <Tag key={scope}>{scope}</Tag>
          ))}
        </Space>
      ),
    },
    {
      title: '状态',
      dataIndex: 'isActive',
      key: 'isActive',
      render: (isActive: boolean) => (
        <Tag color={isActive ? 'green' : 'red'}>
          {isActive ? '启用' : '禁用'}
        </Tag>
      ),
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: string) => new Date(date).toLocaleString('zh-CN'),
    },
    {
      title: '操作',
      key: 'action',
      render: (_: unknown, record: OAuthClient) => (
        <Space>
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            编辑
          </Button>
          <Button
            type="link"
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleDelete(record.id)}
          >
            删除
          </Button>
        </Space>
      ),
    },
  ]

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-xl font-bold">OAuth客户端管理</h1>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
          创建客户端
        </Button>
      </div>

      <Table
        columns={columns}
        dataSource={clients}
        rowKey="id"
        loading={isLoading}
        pagination={{ pageSize: 10 }}
      />

      <Modal
        title={editingClient ? '编辑客户端' : '创建客户端'}
        open={isModalOpen}
        onCancel={() => {
          setIsModalOpen(false)
          setEditingClient(null)
          form.resetFields()
        }}
        onOk={handleSubmit}
        confirmLoading={createMutation.isPending || updateMutation.isPending}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="name"
            label="名称"
            rules={[{ required: true, message: '请输入客户端名称' }]}
          >
            <Input placeholder="请输入客户端名称" />
          </Form.Item>

          <Form.Item
            name="redirectUris"
            label="回调地址"
            rules={[{ required: true, message: '请输入回调地址' }]}
          >
            <Input.TextArea
              placeholder="每行一个回调地址"
              rows={3}
            />
          </Form.Item>

          <Form.Item
            name="scopes"
            label="权限范围"
            initialValue="openid\nprofile\nemail"
          >
            <Input.TextArea
              placeholder="每行一个权限范围，默认为 openid profile email"
              rows={3}
            />
          </Form.Item>

          {editingClient && (
            <Form.Item name="isActive" label="状态" valuePropName="checked">
              <Switch />
            </Form.Item>
          )}
        </Form>
      </Modal>
    </div>
  )
}
