'use client'

import { useQuery } from '@tanstack/react-query'
import { Card, Row, Col, Typography } from 'antd'
import { AppstoreOutlined, ArrowRightOutlined } from '@ant-design/icons'
import Link from 'next/link'
import type { System } from '@prisma/client'

const { Title, Text } = Typography

function fetchSystems(): Promise<System[]> {
  return fetch('/api/systems').then(res => res.json())
}

export default function HomePage() {
  const { data: systems } = useQuery({
    queryKey: ['systems'],
    queryFn: fetchSystems,
  })

  return (
    <div>
      <Title level={2}>欢迎使用 Portal系统</Title>
      <Text type="secondary">选择一个子系统开始工作</Text>

      {systems && systems.length > 0 ? (
        <Row gutter={[16, 16]} style={{ marginTop: '24px' }}>
          {systems.map(system => (
            <Col span={8} key={system.id}>
              <Link href={`/app/${system.code}`} style={{ textDecoration: 'none' }}>
                <Card
                  hoverable
                  style={{ cursor: 'pointer' }}
                  actions={[
                    <span>
                      进入 <ArrowRightOutlined />
                    </span>,
                  ]}
                >
                  <div style={{ display: 'flex', alignItems: 'center', marginBottom: '12px' }}>
                    <AppstoreOutlined style={{ fontSize: '32px', color: '#1890ff', marginRight: '12px' }} />
                    <div>
                      <Title level={4} style={{ margin: 0 }}>{system.name}</Title>
                      <Text type="secondary" style={{ fontSize: '12px' }}>{system.code}</Text>
                    </div>
                  </div>
                  {system.description && (
                    <Text type="secondary" style={{ fontSize: '13px' }}>
                      {system.description}
                    </Text>
                  )}
                </Card>
              </Link>
            </Col>
          ))}
        </Row>
      ) : (
        <Card style={{ marginTop: '24px', textAlign: 'center', padding: '48px' }}>
          <AppstoreOutlined style={{ fontSize: '48px', color: '#ccc', marginBottom: '16px' }} />
          <Text type="secondary">暂无可用的子系统，请联系管理员添加</Text>
        </Card>
      )}
    </div>
  )
}
