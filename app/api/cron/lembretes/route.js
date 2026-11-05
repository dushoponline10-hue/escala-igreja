import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { enviarParaPessoa } from '@/lib/push'
import { dataBR } from '@/lib/datas'

export const dynamic = 'force-dynamic'

const hora = (h) => (h ? ` às ${h.slice(0, 5)}` : '')

// Roda 1x por dia (vercel.json). Avisa quem serve HOJE e AMANHÃ, e manda os avisos gerais para todos.
export async function GET(request) {
  if (request.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ erro: 'não autorizado' }, { status: 401 })
  }

  const hoje = dataBR(0)
  const amanha = dataBR(1)
  const admin = createAdminClient()
  let total = 0

  // 1) Escalas individuais
  const { data: escalas, error } = await admin
    .from('escalas')
    .select('id, data, horario, funcao, membro_id, ministerios(nome)')
    .in('data', [hoje, amanha])
    .not('membro_id', 'is', null)
  if (error) return NextResponse.json({ erro: error.message }, { status: 500 })

  const ids = escalas.map((e) => e.id)
  const { data: jaEnviadas } = ids.length
    ? await admin.from('notificacoes_enviadas').select('escala_id, tipo').in('escala_id', ids)
    : { data: [] }
  const enviadas = new Set((jaEnviadas || []).map((n) => `${n.escala_id}:${n.tipo}`))

  for (const e of escalas) {
    const tipo = e.data === hoje ? 'dia' : 'vespera'
    if (enviadas.has(`${e.id}:${tipo}`)) continue

    const funcao = e.ministerios?.nome || 'sua escala'
    const detalhe = e.funcao ? ` (${e.funcao})` : ''
    const payload =
      tipo === 'dia'
        ? { title: 'Hoje você está na escala 🙌', body: `${funcao}${detalhe}${hora(e.horario)}. Bom serviço!`, url: '/' }
        : { title: 'Amanhã você está na escala', body: `${funcao}${detalhe}${hora(e.horario)}.`, url: '/' }

    total += await enviarParaPessoa(admin, e.membro_id, payload)
    await admin.from('notificacoes_enviadas').insert({ escala_id: e.id, tipo })
  }

  // 2) Avisos gerais (todos os cadastrados)
  const { data: avisos } = await admin
    .from('avisos')
    .select('id, titulo, data, horario, descricao')
    .in('data', [hoje, amanha])

  if (avisos?.length) {
    const { data: avisosEnviados } = await admin
      .from('avisos_enviados')
      .select('aviso_id, tipo')
      .in('aviso_id', avisos.map((a) => a.id))
    const feitos = new Set((avisosEnviados || []).map((n) => `${n.aviso_id}:${n.tipo}`))
    const { data: pessoas } = await admin.from('profiles').select('id')

    for (const a of avisos) {
      const tipo = a.data === hoje ? 'dia' : 'vespera'
      if (feitos.has(`${a.id}:${tipo}`)) continue
      const payload = {
        title: `${tipo === 'dia' ? 'Hoje' : 'Amanhã'}: ${a.titulo}`,
        body: `${tipo === 'dia' ? 'É hoje' : 'Lembrete para amanhã'}${hora(a.horario)}.${a.descricao ? ' ' + a.descricao : ''}`,
        url: '/',
      }
      for (const p of pessoas || []) total += await enviarParaPessoa(admin, p.id, payload)
      await admin.from('avisos_enviados').insert({ aviso_id: a.id, tipo })
    }
  }

  return NextResponse.json({ escalas: escalas.length, avisos: avisos?.length || 0, avisosEnviados: total })
}
