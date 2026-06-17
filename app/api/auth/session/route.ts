import { NextResponse } from 'next/server'
import { verifySession } from '@/lib/auth'

export async function GET(request: Request) {
  const session = verifySession(request.headers.get('cookie'))

  if (!session) {
    return NextResponse.json({ error: '未登录' }, { status: 401 })
  }

  return NextResponse.json(session)
}
