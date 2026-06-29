import { NextResponse } from 'next/server'
import { verifySession } from '@/lib/auth'
import { getClientById, updateClient, deleteClient } from '@/lib/oauth'

export async function GET(request: Request, { params }: { params: { id: string } }) {
  const session = verifySession(request.headers.get('cookie'))
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: '权限不足' }, { status: 403 })
  }

  const client = await getClientById(params.id)
  if (!client) {
    return NextResponse.json({ error: '客户端不存在' }, { status: 404 })
  }

  return NextResponse.json(client)
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  const session = verifySession(request.headers.get('cookie'))
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: '权限不足' }, { status: 403 })
  }

  const body = await request.json()
  const { name, redirectUris, scopes, isActive } = body

  const client = await updateClient(params.id, {
    name,
    redirectUris,
    scopes,
    isActive,
  })

  if (!client) {
    return NextResponse.json({ error: '客户端不存在' }, { status: 404 })
  }

  return NextResponse.json(client)
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  const session = verifySession(request.headers.get('cookie'))
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: '权限不足' }, { status: 403 })
  }

  const client = await getClientById(params.id)
  if (!client) {
    return NextResponse.json({ error: '客户端不存在' }, { status: 404 })
  }

  await deleteClient(params.id)

  return NextResponse.json({ success: true })
}
