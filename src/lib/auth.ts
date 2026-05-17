import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import { db } from '@/lib/db'
import { users } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import bcrypt from 'bcryptjs'
import { z } from 'zod'

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
})

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: { strategy: 'jwt' },
  pages: {
    signIn: '/login',
  },
  providers: [
    Credentials({
      async authorize(credentials) {
        const parsed = credentialsSchema.safeParse(credentials)
        if (!parsed.success) {
          console.error('[auth] authorize: invalid credentials shape', parsed.error.flatten().fieldErrors)
          return null
        }

        const { email, password } = parsed.data

        let user
        try {
          const [found] = await db
            .select()
            .from(users)
            .where(eq(users.email, email))
            .limit(1)
          user = found
        } catch (err) {
          console.error('[auth] authorize: DB query failed:', err instanceof Error ? err.message : String(err))
          return null
        }

        if (!user || !user.passwordHash) {
          console.log('[auth] authorize: user not found or no password hash for', email)
          return null
        }

        const valid = await bcrypt.compare(password, user.passwordHash)
        if (!valid) {
          console.log('[auth] authorize: password mismatch for', email)
          return null
        }

        console.log('[auth] authorize: success for', email)
        return {
          id: user.id,
          email: user.email,
          name: user.name,
        }
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id
      }
      return token
    },
    session({ session, token }) {
      if (token.id) {
        session.user.id = token.id as string
      }
      return session
    },
  },
})
