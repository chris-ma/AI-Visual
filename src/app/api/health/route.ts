import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  const checks: Record<string, unknown> = {}

  checks.env = {
    DATABASE_URL: !!process.env.DATABASE_URL,
    AUTH_SECRET: !!process.env.AUTH_SECRET,
    NEXTAUTH_URL: process.env.NEXTAUTH_URL ?? '(not set)',
    GOOGLE_AI_API_KEY: !!process.env.GOOGLE_AI_API_KEY,
    NODE_ENV: process.env.NODE_ENV,
  }

  let dbStatus: string
  try {
    const { neon } = await import('@neondatabase/serverless')
    const sql = neon(process.env.DATABASE_URL!)
    await sql`SELECT 1`
    dbStatus = 'ok'
  } catch (err) {
    dbStatus = `error: ${err instanceof Error ? err.message : String(err)}`
  }
  checks.db = dbStatus

  const allOk = dbStatus === 'ok' && !!process.env.DATABASE_URL && !!process.env.AUTH_SECRET
  return NextResponse.json(
    { ok: allOk, checks, ts: new Date().toISOString() },
    { status: allOk ? 200 : 503 }
  )
}
