import { drizzle } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'
import { getDefaultAutoSelectFamilyAttemptTimeout, setDefaultAutoSelectFamilyAttemptTimeout } from 'node:net'
import * as schema from './schema'

// Node's short default can abandon valid database connections on slower networks.
if (getDefaultAutoSelectFamilyAttemptTimeout() < 3000) {
  setDefaultAutoSelectFamilyAttemptTimeout(3000)
}

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  connectionTimeoutMillis: 30000,
  idleTimeoutMillis: 30000,
  max: 5,
})
export const db = drizzle(pool, { schema })
