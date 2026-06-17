'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Table, Button, Modal, Form, Input, Switch, message, Typography } from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons'
import type { System } from '@prisma/client'

const { Title } = Typography

function fetchSystems(): Promise<System[]> {
  return fetch('/api/systems').then(res => res.json())
}

export default function SystemsPage() {
  const [isModalVisible, setIsModalVisible] = useState(false)
  const [editingSystem, setEditingSystem] = useState<System | null>(null)
  const [form] = Form.useForm()
  const queryClient = useQueryClient()

  const { data: systems } = useQuery({
    queryKey: ['systems'],
    queryFn: fetchSystems,
  })

  const createSystem = useMutation({
    mutationFn: (data: Omit<System, 'id' | 'createdAt' | 'updatedAt'>) =>
      fetch('/api/systems', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }).then(res => res.json()),
    onSuccess: () => {
      message.success('创建成功')
      queryClient.invalidateQueries({ queryKey: ['systems'] })
      setIsModalVisible(false)
      form.resetFields()
    },
    onError: () => {
      message.error('创建失败')
    },
  })

  const updateSystem = useMutation({
    mutationFn: (data: { id: string; system: Partial<System> }) =>
      fetch(`/api/systems/${data.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data.system),
      }).then(res => res.json()),
    onSuccess: () => {
      message.success('更新成功')
      queryClient.invalidateQueries({ queryKey: ['systems'] })
      setIsModalVisible(false)
      form.resetFields()
    },
    onError: () => {
      message.error('更新失败')
    },
  })

  const deleteSystem = useMutation({
    mutationFn: (id: string) =>
      fetch(`/api/systems/${id}`, {
        method: 'DELETE',
      }).then(res => res.json()),
    onSuccess: () => {
      message.success('删除成功')
      queryClient.invalidateQueries({ queryKey: ['systems'] })
    },
    onError: () => {
      message.error('删除失败')
    },
  })

  const showModal = (system?: System) => {
    if (system) {
      setEditingSystem(system)
      form.setFieldsValue(system)
    } else {
      setEditingSystem(null)
      form.resetFields()
    }
    setIsModalVisible(true)
  }

  const handleOk = () => {
    form.validateFields().then(values => {
      if (editingSystem) {
        updateSystem.mutate({ id: editingSystem.id, system: values })
      } else {
        createSystem.mutate(values)
      }
    })
  }

  const handleDelete = (id: string) => {
    Modal.confirm({
      title: '确认删除',
      content: '确定要删除这个子系统吗？',
      onOk: () => deleteSystem.mutate(id),
    })
  }

  const columns = [
    { title: '名称', dataIndex: 'name', key: 'name' },
    { title: '编码', dataIndex: 'code', key: 'code' },
    { title: '地址', dataIndex: 'url', key: 'url', ellipsis: true },
    { title: '描述', dataIndex: 'description', key: 'description', ellipsis: true },
    {
      title: '状态',
      dataIndex: 'isActive',
      key: 'isActive',
      render: (isActive: boolean) => (
        <Switch checked={isActive} disabled />
      ),
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: System) => (
        <span>
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => showModal(record)}
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
        </span>
      ),
    },
  ]

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <Title level={2}>子系统管理</Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => showModal()}>
          添加子系统
        </Button>
      </div>

      <Table
        dataSource={systems}
        columns={columns}
        rowKey="id"
        bordered
      />

      <Modal
        title={editingSystem ? '编辑子系统' : '添加子系统'}
        open={isModalVisible}
        onOk={handleOk}
        onCancel={() => {
          setIsModalVisible(false)
          form.resetFields()
        }}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="name" label="名称" rules={[{ required: true }]}>
            <Input placeholder="请输入子系统名称" />
          </Form.Item>
          <Form.Item name="code" label="编码" rules={[{ required: true }]}>
            <Input placeholder="请输入子系统编码" />
          </Form.Item>
          <Form.Item name="url" label="访问地址" rules={[{ required: true }]}>
            <Input placeholder="请输入子系统访问地址" />
          </Form.Item>
          <Form.Item name="icon" label="图标">
            <Input placeholder="Ant Design图标名称" />
          </Form.Item>
          <Form.Item name="description" label="描述">
            <Input.TextArea placeholder="请输入子系统描述" />
          </Form.Item>
          <Form.Item name="isActive" label="启用">
            <Switch defaultChecked />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
