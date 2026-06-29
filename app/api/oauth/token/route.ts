import { NextResponse } from 'next/server'
import { validateClient, validateAuthorizationCode, markCodeAsUsed, createToken, refreshToken } from '@/lib/oauth'
import { prisma } from '@/lib/prisma'

export async function POST(request: Request) {
  const body = await request.json()
  const { client_id, client_secret, code, grant_type, refresh_token, redirect_uri } = body

  if (!client_id || !client_secret) {
    return NextResponse.json({ error: '缺少客户端凭证' }, { status: 400 })
  }

  const client = await validateClient(client_id, client_secret)
  if (!client) {
    return NextResponse.json({ error: '无效的客户端凭证' }, { status: 401 })
  }

  if (grant_type === 'authorization_code') {
    if (!code || !redirect_uri) {
      return NextResponse.json({ error: '缺少授权码或回调地址' }, { status: 400 })
    }

    const codeData = await validateAuthorizationCode(code)
    if (!codeData) {
      return NextResponse.json({ error: '无效的授权码' }, { status: 401 })
    }

    if (codeData.clientId !== client_id || codeData.redirectUri !== redirect_uri) {
      return NextResponse.json({ error: '授权码不匹配' }, { status: 401 })
    }

    await markCodeAsUsed(code)

    const token = await createToken(client_id, codeData.userId, client.scopes.join(' '))
    return NextResponse.json(token)
  } else if (grant_type === 'refresh_token') {
    if (!refresh_token) {
      return NextResponse.json({ error: '缺少刷新Token' }, { status: 400 })
    }

    const token = await refreshToken(refresh_token)
    if (!token) {
      return NextResponse.json({ error: '无效的刷新Token' }, { status: 401 })
    }

    return NextResponse.json(token)
  } else {
    return NextResponse.json({ error: '不支持的授权类型' }, { status: 400 })
  }
}
