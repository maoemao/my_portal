import { NextResponse } from 'next/server'

export async function middleware(request: Request) {
  const { pathname } = new URL(request.url)

  const authPaths = ['/login', '/register', '/forgot-password']
  const isAuthPath = authPaths.some(path => pathname.startsWith(path))

  const sessionCookie = request.headers.get('cookie')?.includes('next-auth.session-token')

  if (!sessionCookie && !isAuthPath) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  if (sessionCookie && isAuthPath) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}
