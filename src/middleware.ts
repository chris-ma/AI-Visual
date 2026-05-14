import { auth } from '@/lib/auth'
import { NextResponse } from 'next/server'

export default auth((req) => {
  const { pathname } = req.nextUrl
  const isLoggedIn = !!req.auth

  const isAuthRoute = pathname.startsWith('/auth')
  const isPublicRoute = pathname === '/'
  const isApiRoute = pathname.startsWith('/api')
  const isOnboarding = pathname.startsWith('/onboarding')

  if (isApiRoute) return NextResponse.next()
  if (isPublicRoute) {
    if (isLoggedIn) return NextResponse.redirect(new URL('/dashboard', req.url))
    return NextResponse.redirect(new URL('/auth/login', req.url))
  }
  if (isAuthRoute) {
    if (isLoggedIn) return NextResponse.redirect(new URL('/dashboard', req.url))
    return NextResponse.next()
  }
  if (!isLoggedIn) {
    return NextResponse.redirect(new URL('/auth/login', req.url))
  }
  return NextResponse.next()
})

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
