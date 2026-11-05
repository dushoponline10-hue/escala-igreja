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
  vincularNome,
  criarAviso,
  removerAviso,
} from './actions'

export const dynamic = 'force-dynamic'

export default async function Admin() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  const { data: eu } = await supabase.from('profiles').select('is_admin').eq('id', user.id).single()
  if (!eu?.is_admin) redirect('/')

  const [{ data: ministerios }, { data: pessoas }, { data: escalas }, { data: avisos }] = await Promise.all([
    supabase.from('ministerios').select('id, nome').order('nome'),
    supabase.from('profiles').select('id, nome, telefone, is_admin').order('nome'),
    supabase
      .from('escalas')
      .select('id, data, horario, funcao, membro_id, membro_nome, ministerios(nome), profiles(nome)')
      .gte('data', dataBR(0))
      .order('data')
      .order('horario'),
    supabase.from('avisos').select('id, titulo, data, horario, descricao').gte('data', dataBR(0)).order('data'),
  ])

  // agrupa por data
  const porData = {}
  for (const e of escalas || []) (porData[e.data] ||= []).push(e)

  // nomes escalados que ainda não criaram conta
  const semConta = {}
  for (const e of escalas || []) {
    if (!e.membro_id && e.membro_nome) semConta[e.membro_nome] = (semConta[e.membro_nome] || 0) + 1
  }
  const nomesSemConta = Object.keys(semConta).sort((a, b) => a.localeCompare(b, 'pt-BR'))

  return (
    <main className="page">
      <header className="topo">
        <div className="marca-topo">
          <img src="/logo.png" alt="Viver Church" />
          <div>
            <h1>
              Montar <span>escalas</span>
            </h1>
            <p className="sub">Painel da liderança</p>
          </div>
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
          <label htmlFor="ministerio_id">Função</label>
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
          <label htmlFor="funcao">Detalhe (opcional)</label>
          <input id="funcao" name="funcao" placeholder="Ex.: culto da noite, vocal, câmera" />
          <label htmlFor="observacao">Observação (opcional)</label>
          <input id="observacao" name="observacao" placeholder="Ex.: chegar 30 min antes" />
          <label>Quem vai servir</label>
          <div className="pessoas">
            {!pessoas?.length && <span className="vazio">Ninguém cadastrado ainda.</span>}
            {pessoas?.map((p) => (
              <label key={p.id}>
                <input type="checkbox" name="membros" value={p.id} /> {p.nome || '(sem nome)'}
              </label>
            ))}
          </div>
          <label htmlFor="nomes">Quem ainda não tem conta (opcional)</label>
          <input id="nomes" name="nomes" placeholder="Nomes separados por vírgula. Ex.: Fernanda, João Pedro" />
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
                    <strong>{e.profiles?.nome || e.membro_nome}</strong>
                    {!e.membro_id && <span className="tag sem-conta">sem conta</span>} · {e.ministerios?.nome}
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
        <h2>Avisos para todos</h2>
        <p className="nota">Todos os cadastrados recebem o aviso na véspera e no dia (às 7h). Marque "Avisar todos agora" para mandar também na hora.</p>
        <ul className="lista-simples">
          {avisos?.map((a) => (
            <li key={a.id}>
              <span>
                <strong>{a.titulo}</strong> · <span style={{ textTransform: 'capitalize' }}>{dataExtenso(a.data)}</span>
                {a.horario ? ` · ${a.horario.slice(0, 5)}` : ''}
              </span>
              <form action={removerAviso}>
                <input type="hidden" name="id" value={a.id} />
                <BotaoEnviar className="btn perigo">Remover</BotaoEnviar>
              </form>
            </li>
          ))}
        </ul>
        <form action={criarAviso} style={{ marginTop: 10 }}>
          <label htmlFor="titulo">Título</label>
          <input id="titulo" name="titulo" required placeholder="Ex.: Lavar a igreja" />
          <div className="linha">
            <div>
              <label htmlFor="aviso-data">Data</label>
              <input id="aviso-data" name="data" type="date" required min={dataBR(0)} />
            </div>
            <div>
              <label htmlFor="aviso-hora">Horário</label>
              <input id="aviso-hora" name="horario" type="time" />
            </div>
          </div>
          <label htmlFor="descricao">Detalhes (opcional)</label>
          <input id="descricao" name="descricao" placeholder="Ex.: reunião de líderes no salão" />
          <label className="checa">
            <input type="checkbox" name="agora" defaultChecked /> Avisar todos agora também
          </label>
          <BotaoEnviar className="btn full">Criar aviso</BotaoEnviar>
        </form>
      </section>

      {nomesSemConta.length > 0 && (
        <section className="card">
          <h2>Escalados sem conta ({nomesSemConta.length})</h2>
          <p className="nota">
            Quando a pessoa cria a conta com o mesmo nome, as escalas passam para ela sozinhas. Se o nome ficou
            diferente, ligue aqui.
          </p>
          <ul className="lista-simples">
            {nomesSemConta.map((nome) => (
              <li key={nome}>
                <span>
                  <strong>{nome}</strong> · {semConta[nome]} escala{semConta[nome] > 1 ? 's' : ''}
                </span>
                {pessoas?.length > 0 && (
                  <form action={vincularNome} className="inline">
                    <input type="hidden" name="nome" value={nome} />
                    <select name="membro_id" required defaultValue="" aria-label={`Ligar ${nome} a`}>
                      <option value="" disabled>
                        Ligar a...
                      </option>
                      {pessoas.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.nome || '(sem nome)'}
                        </option>
                      ))}
                    </select>
                    <BotaoEnviar className="btn sec peq">Ok</BotaoEnviar>
                  </form>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="card">
        <h2>Funções</h2>
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
          <input name="nome" placeholder="Nova função" required />
          <BotaoEnviar className="btn">Adicionar</BotaoEnviar>
        </form>
      </section>

      <section className="card">
        <h2>Pessoas cadastradas ({pessoas?.length || 0})</h2>
        <p className="nota">Para entrar na lista, a pessoa cria a conta no app. Quem é líder pode virar admin.</p>
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
