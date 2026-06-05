import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import pg from 'pg'

const { Pool } = pg

const connectionString = process.env.DATABASE_URL
if (!connectionString) {
  throw new Error('DATABASE_URL is required for Prisma')
}

const pool = new Pool({ connectionString })
const adapter = new PrismaPg(pool)

/** Shared Prisma client (Prisma 7 + PostgreSQL adapter). */
export const prisma = new PrismaClient({ adapter })

export { PrismaClient }
