import jwt from 'jsonwebtoken'

export interface Session {
  user: {
    id: string
    email: string
    name?: string
    role: string
  }
}

export function verifySession(cookie: string | null): Session | null {
  if (!cookie) return null

  const sessionToken = cookie.split('; ').find(c => c.startsWith('next-auth.session-token='))
  if (!sessionToken) return null

  const token = sessionToken.split('=')[1]

  try {
    const decoded = jwt.verify(token, process.env.NEXTAUTH_SECRET!) as {
      userId: string
      email: string
      role: string
    }

    return {
      user: {
        id: decoded.userId,
        email: decoded.email,
        role: decoded.role,
      },
    }
  } catch {
    return null
  }
}
