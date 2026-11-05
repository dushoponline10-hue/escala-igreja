// Cria as tabelas no Supabase: npm run db:setup
import { readFile, readdir } from 'node:fs/promises'
import { config } from 'dotenv'
import pg from 'pg'

config({ path: '.env.local' })

const url = process.env.SUPABASE_DB_URL
if (!url) {
  console.error('Faltou preencher SUPABASE_DB_URL no arquivo .env.local')
  process.exit(1)
}

const pasta = new URL('../supabase/', import.meta.url)
const migracoes = (await readdir(pasta)).filter((f) => f.startsWith('migracao-')).sort()
const arquivos = ['schema.sql', ...migracoes]
const client = new pg.Client({ connectionString: url, ssl: { rejectUnauthorized: false } })

try {
  await client.connect()
  for (const f of arquivos) {
    await client.query(await readFile(new URL(f, pasta), 'utf8'))
    console.log('ok:', f)
  }
  console.log('Banco pronto! Tabelas e regras criadas.')
} catch (err) {
  console.error('Erro ao criar o banco:', err.message)
  process.exitCode = 1
} finally {
  await client.end()
}
