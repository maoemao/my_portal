import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifySession } from '@/lib/auth'

export async function GET(request: Request) {
  const session = verifySession(request.headers.get('cookie'))
  if (!session) {
    return NextResponse.json({ error: '未登录' }, { status: 401 })
  }

  const systems = await prisma.system.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: 'asc' },
  })

  return NextResponse.json(systems)
}

export async function POST(request: Request) {
  const session = verifySession(request.headers.get('cookie'))
  if (!session) {
    return NextResponse.json({ error: '未登录' }, { status: 401 })
  }

  if (session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: '无权限' }, { status: 403 })
  }

  const { name, code, url, icon, description } = await request.json()

  if (!name || !code || !url) {
    return NextResponse.json({ error: '缺少必要参数' }, { status: 400 })
  }

  const existingSystem = await prisma.system.findUnique({ where: { code } })
  if (existingSystem) {
    return NextResponse.json({ error: '子系统编码已存在' }, { status: 400 })
  }

  const system = await prisma.system.create({
    data: {
      name,
      code,
      url,
      icon,
      description,
    },
  })

  return NextResponse.json(system)
}
