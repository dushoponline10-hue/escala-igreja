// Cria as tabelas no Supabase: npm run db:setup
import { readFile } from 'node:fs/promises'
import { config } from 'dotenv'
import pg from 'pg'

config({ path: '.env.local' })

const url = process.env.SUPABASE_DB_URL
if (!url) {
  console.error('Faltou preencher SUPABASE_DB_URL no arquivo .env.local')
  process.exit(1)
}

const sql = await readFile(new URL('../supabase/schema.sql', import.meta.url), 'utf8')
const client = new pg.Client({ connectionString: url, ssl: { rejectUnauthorized: false } })

try {
  await client.connect()
  await client.query(sql)
  console.log('Banco pronto! Tabelas e regras criadas.')
} catch (err) {
  console.error('Erro ao criar o banco:', err.message)
  process.exitCode = 1
} finally {
  await client.end()
}
