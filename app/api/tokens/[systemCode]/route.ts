import { NextResponse } from 'next/server'
import { verifySession } from '@/lib/auth'
import { generateSystemToken } from '@/lib/jwt'

export async function GET(request: Request) {
  const session = verifySession(request.headers.get('cookie'))
  if (!session) {
    return NextResponse.json({ error: '未登录' }, { status: 401 })
  }

  const url = new URL(request.url)
  const systemCode = url.pathname.split('/').pop() || ''

  try {
    const token = await generateSystemToken(session.user.id, systemCode)
    return NextResponse.json({ token })
  } catch (error) {
    return NextResponse.json({ error: '获取Token失败' }, { status: 500 })
  }
}
