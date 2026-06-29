import crypto from 'crypto'
import { prisma } from './prisma'

export interface OAuthClientData {
  id: string
  clientId: string
  name: string
  redirectUris: string[]
  scopes: string[]
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

export interface OAuthTokenData {
  accessToken: string
  refreshToken: string
  tokenType: string
  expiresIn: number
  scope: string
}

export function generateClientId(): string {
  return 'portal-client-' + crypto.randomBytes(16).toString('hex')
}

export function generateClientSecret(): string {
  return crypto.randomBytes(32).toString('hex')
}

export function generateAuthorizationCode(): string {
  return crypto.randomBytes(32).toString('hex')
}

export function generateAccessToken(): string {
  return crypto.randomBytes(64).toString('hex')
}

export function generateRefreshToken(): string {
  return crypto.randomBytes(64).toString('hex')
}

export async function createClient(data: {
  name: string
  redirectUris: string[]
  scopes?: string[]
}): Promise<OAuthClientData> {
  const client = await prisma.oAuthClient.create({
    data: {
      clientId: generateClientId(),
      clientSecret: generateClientSecret(),
      name: data.name,
      redirectUris: data.redirectUris,
      scopes: data.scopes || ['openid', 'profile', 'email'],
    },
  })

  return {
    id: client.id,
    clientId: client.clientId,
    name: client.name,
    redirectUris: client.redirectUris,
    scopes: client.scopes,
    isActive: client.isActive,
    createdAt: client.createdAt,
    updatedAt: client.updatedAt,
  }
}

export async function getClientByClientId(clientId: string): Promise<OAuthClientData | null> {
  const client = await prisma.oAuthClient.findUnique({
    where: { clientId },
  })

  if (!client) return null

  return {
    id: client.id,
    clientId: client.clientId,
    name: client.name,
    redirectUris: client.redirectUris,
    scopes: client.scopes,
    isActive: client.isActive,
    createdAt: client.createdAt,
    updatedAt: client.updatedAt,
  }
}

export async function validateClient(clientId: string, clientSecret: string): Promise<OAuthClientData | null> {
  const client = await prisma.oAuthClient.findUnique({
    where: { clientId },
  })

  if (!client || !client.isActive) return null
  if (client.clientSecret !== clientSecret) return null

  return {
    id: client.id,
    clientId: client.clientId,
    name: client.name,
    redirectUris: client.redirectUris,
    scopes: client.scopes,
    isActive: client.isActive,
    createdAt: client.createdAt,
    updatedAt: client.updatedAt,
  }
}

export async function validateRedirectUri(clientId: string, redirectUri: string): Promise<boolean> {
  const client = await prisma.oAuthClient.findUnique({
    where: { clientId },
  })

  if (!client || !client.isActive) return false

  return client.redirectUris.includes(redirectUri)
}

export async function createAuthorizationCode(clientId: string, userId: string, redirectUri: string): Promise<string> {
  const code = generateAuthorizationCode()

  await prisma.oAuthCode.create({
    data: {
      code,
      clientId,
      userId,
      redirectUri,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000),
    },
  })

  return code
}

export async function validateAuthorizationCode(code: string): Promise<{ clientId: string; userId: string; redirectUri: string } | null> {
  const authCode = await prisma.oAuthCode.findUnique({
    where: { code },
    include: { client: true },
  })

  if (!authCode || authCode.used) return null
  if (!authCode.client.isActive) return null
  if (new Date() > authCode.expiresAt) return null

  return {
    clientId: authCode.clientId,
    userId: authCode.userId,
    redirectUri: authCode.redirectUri,
  }
}

export async function markCodeAsUsed(code: string): Promise<void> {
  await prisma.oAuthCode.update({
    where: { code },
    data: { used: true },
  })
}

export async function createToken(clientId: string, userId: string, scope: string): Promise<OAuthTokenData> {
  const accessToken = generateAccessToken()
  const refreshToken = generateRefreshToken()
  const expiresIn = 3600

  await prisma.oAuthToken.create({
    data: {
      accessToken,
      refreshToken,
      clientId,
      userId,
      expiresAt: new Date(Date.now() + expiresIn * 1000),
    },
  })

  return {
    accessToken,
    refreshToken,
    tokenType: 'Bearer',
    expiresIn,
    scope,
  }
}

export async function validateAccessToken(accessToken: string): Promise<{ userId: string; clientId: string } | null> {
  const token = await prisma.oAuthToken.findUnique({
    where: { accessToken },
    include: { client: true },
  })

  if (!token || token.revoked) return null
  if (!token.client.isActive) return null
  if (new Date() > token.expiresAt) return null

  return {
    userId: token.userId,
    clientId: token.clientId,
  }
}

export async function revokeToken(accessToken: string): Promise<void> {
  await prisma.oAuthToken.update({
    where: { accessToken },
    data: { revoked: true },
  })
}

export async function refreshToken(refreshToken: string): Promise<OAuthTokenData | null> {
  const token = await prisma.oAuthToken.findUnique({
    where: { refreshToken },
    include: { client: true },
  })

  if (!token || token.revoked) return null
  if (!token.client.isActive) return null

  await prisma.oAuthToken.update({
    where: { refreshToken },
    data: { revoked: true },
  })

  const newToken = await createToken(token.clientId, token.userId, token.client.scopes.join(' '))
  return newToken
}

export async function getClients(): Promise<OAuthClientData[]> {
  const clients = await prisma.oAuthClient.findMany({
    orderBy: { createdAt: 'desc' },
  })

  return clients.map((client) => ({
    id: client.id,
    clientId: client.clientId,
    name: client.name,
    redirectUris: client.redirectUris,
    scopes: client.scopes,
    isActive: client.isActive,
    createdAt: client.createdAt,
    updatedAt: client.updatedAt,
  }))
}

export async function getClientById(id: string): Promise<OAuthClientData | null> {
  const client = await prisma.oAuthClient.findUnique({
    where: { id },
  })

  if (!client) return null

  return {
    id: client.id,
    clientId: client.clientId,
    name: client.name,
    redirectUris: client.redirectUris,
    scopes: client.scopes,
    isActive: client.isActive,
    createdAt: client.createdAt,
    updatedAt: client.updatedAt,
  }
}

export async function updateClient(id: string, data: {
  name?: string
  redirectUris?: string[]
  scopes?: string[]
  isActive?: boolean
}): Promise<OAuthClientData | null> {
  const client = await prisma.oAuthClient.update({
    where: { id },
    data,
  })

  return {
    id: client.id,
    clientId: client.clientId,
    name: client.name,
    redirectUris: client.redirectUris,
    scopes: client.scopes,
    isActive: client.isActive,
    createdAt: client.createdAt,
    updatedAt: client.updatedAt,
  }
}

export async function deleteClient(id: string): Promise<void> {
  await prisma.oAuthToken.deleteMany({ where: { clientId: id } })
  await prisma.oAuthCode.deleteMany({ where: { clientId: id } })
  await prisma.oAuthClient.delete({ where: { id } })
}
