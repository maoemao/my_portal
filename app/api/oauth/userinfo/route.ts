import { NextResponse } from 'next/server'
import { validateAccessToken } from '@/lib/oauth'
import { prisma } from '@/lib/prisma'

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return NextResponse.json({ error: '未授权' }, { status: 401 })
  }

  const accessToken = authHeader.split(' ')[1]
  const tokenData = await validateAccessToken(accessToken)

  if (!tokenData) {
    return NextResponse.json({ error: '无效的Token' }, { status: 401 })
  }

  const user = await prisma.user.findUnique({
    where: { id: tokenData.userId },
  })

  if (!user || user.status !== 'ACTIVE') {
    return NextResponse.json({ error: '用户不存在或已禁用' }, { status: 401 })
  }

  return NextResponse.json({
    sub: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
  })
}
