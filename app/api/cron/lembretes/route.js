import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { enviarParaPessoa } from '@/lib/push'
import { dataBR } from '@/lib/datas'

export const dynamic = 'force-dynamic'

// Roda 1x por dia (vercel.json). Avisa quem serve HOJE e quem serve AMANHÃ.
export async function GET(request) {
  if (request.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ erro: 'não autorizado' }, { status: 401 })
  }

  const hoje = dataBR(0)
  const amanha = dataBR(1)
  const admin = createAdminClient()

  const { data: escalas, error } = await admin
    .from('escalas')
    .select('id, data, horario, funcao, membro_id, ministerios(nome)')
    .in('data', [hoje, amanha])
  if (error) return NextResponse.json({ erro: error.message }, { status: 500 })

  const ids = escalas.map((e) => e.id)
  const { data: jaEnviadas } = ids.length
    ? await admin.from('notificacoes_enviadas').select('escala_id, tipo').in('escala_id', ids)
    : { data: [] }
  const enviadas = new Set((jaEnviadas || []).map((n) => `${n.escala_id}:${n.tipo}`))

  let total = 0
  for (const e of escalas) {
    const tipo = e.data === hoje ? 'dia' : 'vespera'
    if (enviadas.has(`${e.id}:${tipo}`)) continue

    const ministerio = e.ministerios?.nome || 'sua escala'
    const hora = e.horario ? ` às ${e.horario.slice(0, 5)}` : ''
    const funcao = e.funcao ? ` (${e.funcao})` : ''
    const payload =
      tipo === 'dia'
        ? { title: `Hoje você serve no ${ministerio} 🙌`, body: `Te esperamos${hora}${funcao}. Bom serviço!`, url: '/' }
        : { title: `Amanhã é sua escala no ${ministerio}`, body: `Lembrete: amanhã${hora}${funcao}.`, url: '/' }

    const n = await enviarParaPessoa(admin, e.membro_id, payload)
    await admin.from('notificacoes_enviadas').insert({ escala_id: e.id, tipo })
    total += n
  }

  return NextResponse.json({ escalas: escalas.length, avisosEnviados: total })
}
