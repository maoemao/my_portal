import { NextResponse } from 'next/server'
import { verifySession } from '@/lib/auth'
import { getClients, createClient } from '@/lib/oauth'

export async function GET(request: Request) {
  const session = verifySession(request.headers.get('cookie'))
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: '权限不足' }, { status: 403 })
  }

  const clients = await getClients()
  return NextResponse.json(clients)
}

export async function POST(request: Request) {
  const session = verifySession(request.headers.get('cookie'))
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: '权限不足' }, { status: 403 })
  }

  const body = await request.json()
  const { name, redirectUris, scopes } = body

  if (!name || !redirectUris || !Array.isArray(redirectUris)) {
    return NextResponse.json({ error: '参数错误' }, { status: 400 })
  }

  const client = await createClient({
    name,
    redirectUris,
    scopes,
  })

  return NextResponse.json(client, { status: 201 })
}
