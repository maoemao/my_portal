import { NextResponse } from 'next/server'
import { validateToken } from '@/lib/jwt'

export async function POST(request: Request) {
  const { token } = await request.json()

  if (!token) {
    return NextResponse.json({ error: '缺少Token' }, { status: 400 })
  }

  const decoded = await validateToken(token)

  if (!decoded) {
    return NextResponse.json({ error: 'Token无效' }, { status: 401 })
  }

  return NextResponse.json({
    userId: decoded.sub,
    email: decoded.email,
    name: decoded.name,
    role: decoded.role,
    system: decoded.system,
  })
}
