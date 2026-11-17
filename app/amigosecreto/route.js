import { readFile } from 'fs/promises'
import path from 'path'

export const dynamic = 'force-static'

export async function GET() {
  const html = await readFile(path.join(process.cwd(), 'public', 'amigosecreto.html'), 'utf8')
  return new Response(html, { headers: { 'content-type': 'text/html; charset=utf-8' } })
}
