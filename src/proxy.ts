import { auth } from '@/lib/auth'
import { NextResponse } from 'next/server'

export default auth((req) => {
  const { pathname } = req.nextUrl
  const isLoggedIn = !!req.auth

  console.log(`[middleware] ${req.method} ${pathname} | auth=${isLoggedIn}`)

  const isAuthRoute = pathname === '/login' || pathname === '/signup'
  const isPublicRoute = pathname === '/'
  const isApiRoute = pathname.startsWith('/api')

  if (isApiRoute) return NextResponse.next()
  if (isPublicRoute) {
    if (isLoggedIn) {
      console.log('[middleware] / → /dashboard (logged in)')
      return NextResponse.redirect(new URL('/dashboard', req.url))
    }
    console.log('[middleware] / → /login (not logged in)')
    return NextResponse.redirect(new URL('/login', req.url))
  }
  if (isAuthRoute) {
    if (isLoggedIn) {
      console.log(`[middleware] ${pathname} → /dashboard (already logged in)`)
      return NextResponse.redirect(new URL('/dashboard', req.url))
    }
    return NextResponse.next()
  }
  if (!isLoggedIn) {
    console.log(`[middleware] ${pathname} → /login (unauthenticated)`)
    return NextResponse.redirect(new URL('/login', req.url))
  }
  return NextResponse.next()
})

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
