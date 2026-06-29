import { NextResponse } from 'next/server'
import { verifySession } from '@/lib/auth'
import { getClientByClientId, validateRedirectUri, createAuthorizationCode } from '@/lib/oauth'

export async function GET(request: Request) {
  const url = new URL(request.url)
  const clientId = url.searchParams.get('client_id')
  const redirectUri = url.searchParams.get('redirect_uri')
  const responseType = url.searchParams.get('response_type')
  const scope = url.searchParams.get('scope') || 'openid profile email'
  const state = url.searchParams.get('state') || ''

  if (!clientId || !redirectUri || !responseType) {
    return NextResponse.json({ error: '缺少必要参数' }, { status: 400 })
  }

  if (responseType !== 'code') {
    return NextResponse.json({ error: '不支持的响应类型' }, { status: 400 })
  }

  const client = await getClientByClientId(clientId)
  if (!client || !client.isActive) {
    return NextResponse.json({ error: '无效的客户端' }, { status: 400 })
  }

  const isValidRedirect = await validateRedirectUri(clientId, redirectUri)
  if (!isValidRedirect) {
    return NextResponse.json({ error: '无效的回调地址' }, { status: 400 })
  }

  const session = verifySession(request.headers.get('cookie'))
  if (!session) {
    const loginUrl = `/login?redirect=/oauth/authorize?${url.searchParams.toString()}`
    return NextResponse.redirect(new URL(loginUrl, url.origin))
  }

  const code = await createAuthorizationCode(clientId, session.user.id, redirectUri)

  const callbackUrl = new URL(redirectUri)
  callbackUrl.searchParams.set('code', code)
  if (state) {
    callbackUrl.searchParams.set('state', state)
  }

  return NextResponse.redirect(callbackUrl)
}
