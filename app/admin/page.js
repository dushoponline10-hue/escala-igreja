import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { dataBR, dataExtenso } from '@/lib/datas'
import BotaoEnviar from '@/components/BotaoEnviar'
import {
  criarEscala,
  removerEscala,
  criarMinisterio,
  removerMinisterio,
  alternarAdmin,
} from './actions'

export const dynamic = 'force-dynamic'

export default async function Admin() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  const { data: eu } = await supabase.from('profiles').select('is_admin').eq('id', user.id).single()
  if (!eu?.is_admin) redirect('/')

  const [{ data: ministerios }, { data: pessoas }, { data: escalas }] = await Promise.all([
    supabase.from('ministerios').select('id, nome').order('nome'),
    supabase.from('profiles').select('id, nome, telefone, is_admin').order('nome'),
    supabase
      .from('escalas')
      .select('id, data, horario, funcao, ministerios(nome), profiles(nome)')
      .gte('data', dataBR(0))
      .order('data')
      .order('horario'),
  ])

  // agrupa por data
  const porData = {}
  for (const e of escalas || []) (porData[e.data] ||= []).push(e)

  return (
    <main className="page">
      <header className="topo">
        <div>
          <h1>Montar escalas</h1>
          <p className="sub">Painel da liderança</p>
        </div>
        <Link href="/" className="btn sec peq">
          Voltar
        </Link>
      </header>

      <section className="card">
        <h2>Nova escala</h2>
        <form action={criarEscala}>
          <div className="linha">
            <div>
              <label htmlFor="data">Data</label>
              <input id="data" name="data" type="date" required min={dataBR(0)} />
            </div>
            <div>
              <label htmlFor="horario">Horário</label>
              <input id="horario" name="horario" type="time" />
            </div>
          </div>
          <label htmlFor="ministerio_id">Ministério</label>
          <select id="ministerio_id" name="ministerio_id" required defaultValue="">
            <option value="" disabled>
              Escolha
            </option>
            {ministerios?.map((m) => (
              <option key={m.id} value={m.id}>
                {m.nome}
              </option>
            ))}
          </select>
          <label htmlFor="funcao">Função (opcional)</label>
          <input id="funcao" name="funcao" placeholder="Ex.: vocal, câmera, porta principal" />
          <label htmlFor="observacao">Observação (opcional)</label>
          <input id="observacao" name="observacao" placeholder="Ex.: chegar 30 min antes para ensaio" />
          <label>Quem vai servir</label>
          <div className="pessoas">
            {!pessoas?.length && <span className="vazio">Ninguém cadastrado ainda.</span>}
            {pessoas?.map((p) => (
              <label key={p.id}>
                <input type="checkbox" name="membros" value={p.id} /> {p.nome || '(sem nome)'}
              </label>
            ))}
          </div>
          <BotaoEnviar className="btn full">Salvar escala</BotaoEnviar>
        </form>
      </section>

      <section className="card">
        <h2>Próximas escalas</h2>
        {!escalas?.length && <p className="vazio">Nenhuma escala marcada.</p>}
        {Object.entries(porData).map(([data, lista]) => (
          <div key={data}>
            <p className="grupo-data">{dataExtenso(data)}</p>
            <ul className="lista-simples">
              {lista.map((e) => (
                <li key={e.id}>
                  <span>
                    <strong>{e.profiles?.nome}</strong> · {e.ministerios?.nome}
                    {e.funcao ? ` (${e.funcao})` : ''}
                    {e.horario ? ` · ${e.horario.slice(0, 5)}` : ''}
                  </span>
                  <form action={removerEscala}>
                    <input type="hidden" name="id" value={e.id} />
                    <BotaoEnviar className="btn perigo" aria-label="Remover">
                      Remover
                    </BotaoEnviar>
                  </form>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </section>

      <section className="card">
        <h2>Ministérios</h2>
        <ul className="lista-simples">
          {ministerios?.map((m) => (
            <li key={m.id}>
              <span>{m.nome}</span>
              <form action={removerMinisterio}>
                <input type="hidden" name="id" value={m.id} />
                <BotaoEnviar className="btn perigo">Remover</BotaoEnviar>
              </form>
            </li>
          ))}
        </ul>
        <form action={criarMinisterio} className="inline" style={{ marginTop: 10 }}>
          <input name="nome" placeholder="Novo ministério" required />
          <BotaoEnviar className="btn">Adicionar</BotaoEnviar>
        </form>
      </section>

      <section className="card">
        <h2>Pessoas cadastradas ({pessoas?.length || 0})</h2>
        <p className="sub" style={{ marginTop: 0, color: 'var(--muted)', fontSize: '.88rem' }}>
          Para entrar na lista, a pessoa cria a conta no app. Quem é líder pode virar admin.
        </p>
        <ul className="lista-simples">
          {pessoas?.map((p) => (
            <li key={p.id}>
              <span>
                <strong>{p.nome || '(sem nome)'}</strong>
                {p.telefone ? <span style={{ color: 'var(--muted)' }}> · {p.telefone}</span> : null}
              </span>
              {p.id !== user.id && (
                <form action={alternarAdmin}>
                  <input type="hidden" name="id" value={p.id} />
                  <input type="hidden" name="valor" value={String(!p.is_admin)} />
                  <BotaoEnviar className="btn sec peq">{p.is_admin ? 'Tirar admin' : 'Tornar admin'}</BotaoEnviar>
                </form>
              )}
              {p.id === user.id && <span className="tag">Você · admin</span>}
            </li>
          ))}
        </ul>
      </section>
    </main>
  )
}
