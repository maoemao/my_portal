import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifySession } from '@/lib/auth'

export async function GET(request: Request) {
  const session = verifySession(request.headers.get('cookie'))
  if (!session) {
    return NextResponse.json({ error: '未登录' }, { status: 401 })
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      email: true,
      name: true,
      avatar: true,
      role: true,
      createdAt: true,
    },
  })

  if (!user) {
    return NextResponse.json({ error: '用户不存在' }, { status: 404 })
  }

  return NextResponse.json(user)
}

export async function PUT(request: Request) {
  const session = verifySession(request.headers.get('cookie'))
  if (!session) {
    return NextResponse.json({ error: '未登录' }, { status: 401 })
  }

  const { name, avatar } = await request.json()

  const user = await prisma.user.update({
    where: { id: session.user.id },
    data: {
      name,
      avatar,
    },
    select: {
      id: true,
      email: true,
      name: true,
      avatar: true,
      role: true,
    },
  })

  return NextResponse.json(user)
}
