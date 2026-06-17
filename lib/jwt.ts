import jwt from 'jsonwebtoken'
import { prisma } from './prisma'

export interface DecodedToken {
  sub: string
  email: string
  name: string
  role: string
  system: string
  iat: number
  exp: number
}

export async function generateSystemToken(userId: string, systemCode: string): Promise<string> {
  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (!user) throw new Error('用户不存在')

  const payload: Omit<DecodedToken, 'iat' | 'exp'> = {
    sub: userId,
    email: user.email,
    name: user.name,
    role: user.role,
    system: systemCode,
  }

  const token = jwt.sign(payload, process.env.JWT_SECRET!, {
    expiresIn: '1h',
  })

  const system = await prisma.system.findUnique({ where: { code: systemCode } })
  if (system) {
    await prisma.token.create({
      data: {
        userId,
        systemId: system.id,
        token,
        expiresAt: new Date(Date.now() + 3600 * 1000),
      },
    })
  }

  return token
}

export async function validateToken(token: string): Promise<DecodedToken | null> {
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as DecodedToken

    const user = await prisma.user.findUnique({ where: { id: decoded.sub } })
    if (!user || user.status !== 'ACTIVE') return null

    const system = await prisma.system.findUnique({ where: { code: decoded.system } })
    if (!system || !system.isActive) return null

    return decoded
  } catch {
    return null
  }
}

export async function refreshToken(userId: string, systemCode: string): Promise<string> {
  const system = await prisma.system.findUnique({ where: { code: systemCode } })
  if (system) {
    await prisma.token.deleteMany({
      where: { userId, systemId: system.id },
    })
  }

  return generateSystemToken(userId, systemCode)
}
