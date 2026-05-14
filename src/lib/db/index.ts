import { drizzle, type NeonHttpDatabase } from 'drizzle-orm/neon-http'
import { neon } from '@neondatabase/serverless'
import * as schema from './schema'

let _instance: NeonHttpDatabase<typeof schema> | undefined

export const db = new Proxy({} as NeonHttpDatabase<typeof schema>, {
  get(_target, prop) {
    if (!_instance) _instance = drizzle(neon(process.env.DATABASE_URL!), { schema })
    return (_instance as any)[prop]
  },
})

export type Database = typeof db
