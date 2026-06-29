import { NextResponse } from 'next/server'
import { validateAccessToken, revokeToken } from '@/lib/oauth'

export async function POST(request: Request) {
  const authHeader = request.headers.get('authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return NextResponse.json({ error: '未授权' }, { status: 401 })
  }

  const accessToken = authHeader.split(' ')[1]
  const tokenData = await validateAccessToken(accessToken)

  if (!tokenData) {
    return NextResponse.json({ error: '无效的Token' }, { status: 401 })
  }

  await revokeToken(accessToken)

  return NextResponse.json({ success: true })
}
