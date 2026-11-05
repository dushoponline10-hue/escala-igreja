import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { dataBR, dataExtenso, quandoRelativo } from '@/lib/datas'
import AtivarAvisos from '@/components/AtivarAvisos'
import { sair } from './actions'

export const dynamic = 'force-dynamic'

const MESES = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez']

export default async function MinhasEscalas() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: perfil } = await supabase.from('profiles').select('nome, is_admin').eq('id', user.id).single()

  const { data: minhas } = await supabase
    .from('escalas')
    .select('id, data, horario, funcao, observacao, ministerio_id, ministerios(nome)')
    .eq('membro_id', user.id)
    .gte('data', dataBR(0))
    .order('data')
    .order('horario')

  // Quem serve junto (mesmo dia e ministério)
  const datas = [...new Set((minhas || []).map((e) => e.data))]
  let equipe = []
  if (datas.length) {
    const { data } = await supabase
      .from('escalas')
      .select('data, ministerio_id, membro_id, membro_nome, profiles(nome)')
      .in('data', datas)
    equipe = (data || []).filter((x) => x.membro_id !== user.id)
  }

  const { data: avisos } = await supabase
    .from('avisos')
    .select('id, titulo, data, horario, descricao')
    .gte('data', dataBR(0))
    .order('data')

  const primeiroNome = (perfil?.nome || '').split(' ')[0]

  return (
    <main className="page">
      <header className="topo">
        <div className="marca-topo">
          <img src="/logo.png" alt="Viver Church" />
          <div>
            <h1>
              Olá{primeiroNome ? <>, <span>{primeiroNome}</span></> : ''}
            </h1>
            <p className="sub">Suas próximas escalas</p>
          </div>
        </div>
        {perfil?.is_admin && (
          <Link href="/admin" className="btn sec peq">
            Montar escalas
          </Link>
        )}
      </header>

      <AtivarAvisos />

      <section className="card">
        {!minhas?.length && <p className="vazio">Você não está escalado em nenhuma data por enquanto.</p>}
        {minhas?.map((e) => {
          const [, m, d] = e.data.split('-')
          const rel = quandoRelativo(e.data)
          const colegas = equipe
            .filter((x) => x.data === e.data && x.ministerio_id === e.ministerio_id)
            .map((x) => x.profiles?.nome || x.membro_nome)
            .filter(Boolean)
          return (
            <div className="escala" key={e.id}>
              <div className="dia">
                <span className="n">{Number(d)}</span>
                <span className="m">{MESES[Number(m) - 1]}</span>
              </div>
              <div className="info">
                {rel && <span className="tag">{rel}</span>}
                <strong>{e.ministerios?.nome}</strong>
                <div className="det">
                  <span style={{ textTransform: 'capitalize' }}>{dataExtenso(e.data)}</span>
                  {e.horario ? ` · ${e.horario}` : ''}
                  {e.funcao ? ` · ${e.funcao}` : ''}
                </div>
                {e.observacao && <div className="det">{e.observacao}</div>}
                {colegas.length > 0 && <div className="equipe">Com: {colegas.join(', ')}</div>}
              </div>
            </div>
          )
        })}
      </section>

      {avisos?.length > 0 && (
        <section className="card">
          <h2>Avisos para todos</h2>
          {avisos.map((a) => {
            const [, m, d] = a.data.split('-')
            const rel = quandoRelativo(a.data)
            return (
              <div className="escala" key={a.id}>
                <div className="dia">
                  <span className="n">{Number(d)}</span>
                  <span className="m">{MESES[Number(m) - 1]}</span>
                </div>
                <div className="info">
                  {rel && <span className="tag">{rel}</span>}
                  <strong>{a.titulo}</strong>
                  <div className="det">
                    <span style={{ textTransform: 'capitalize' }}>{dataExtenso(a.data)}</span>
                    {a.horario ? ` · ${a.horario.slice(0, 5)}` : ''}
                  </div>
                  {a.descricao && <div className="det">{a.descricao}</div>}
                </div>
              </div>
            )
          })}
        </section>
      )}

      <form action={sair} className="rodape">
        <button className="btn sec peq">Sair</button>
      </form>
    </main>
  )
}
