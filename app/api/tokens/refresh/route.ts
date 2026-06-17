import { NextResponse } from 'next/server'
import { verifySession } from '@/lib/auth'
import { refreshToken } from '@/lib/jwt'

export async function POST(request: Request) {
  const session = verifySession(request.headers.get('cookie'))
  if (!session) {
    return NextResponse.json({ error: '未登录' }, { status: 401 })
  }

  const { systemCode } = await request.json()

  if (!systemCode) {
    return NextResponse.json({ error: '缺少子系统编码' }, { status: 400 })
  }

  try {
    const token = await refreshToken(session.user.id, systemCode)
    return NextResponse.json({ token })
  } catch (error) {
    return NextResponse.json({ error: '刷新Token失败' }, { status: 500 })
  }
}
