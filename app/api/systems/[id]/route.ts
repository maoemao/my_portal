import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifySession } from '@/lib/auth'

export async function GET(request: Request) {
  const session = verifySession(request.headers.get('cookie'))
  if (!session) {
    return NextResponse.json({ error: '未登录' }, { status: 401 })
  }

  const url = new URL(request.url)
  const id = url.pathname.split('/').pop() || ''

  const system = await prisma.system.findUnique({
    where: { id },
  })

  if (!system) {
    return NextResponse.json({ error: '子系统不存在' }, { status: 404 })
  }

  return NextResponse.json(system)
}

export async function PUT(request: Request) {
  const session = verifySession(request.headers.get('cookie'))
  if (!session) {
    return NextResponse.json({ error: '未登录' }, { status: 401 })
  }

  if (session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: '无权限' }, { status: 403 })
  }

  const url = new URL(request.url)
  const id = url.pathname.split('/').pop() || ''
  const { name, code, url: systemUrl, icon, description, isActive } = await request.json()

  const system = await prisma.system.update({
    where: { id },
    data: {
      name,
      code,
      url: systemUrl,
      icon,
      description,
      isActive,
    },
  })

  return NextResponse.json(system)
}

export async function DELETE(request: Request) {
  const session = verifySession(request.headers.get('cookie'))
  if (!session) {
    return NextResponse.json({ error: '未登录' }, { status: 401 })
  }

  if (session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: '无权限' }, { status: 403 })
  }

  const url = new URL(request.url)
  const id = url.pathname.split('/').pop() || ''

  await prisma.system.delete({
    where: { id },
  })

  return NextResponse.json({ success: true })
}
