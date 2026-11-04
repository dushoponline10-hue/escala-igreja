'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const router = useRouter()
  const [modo, setModo] = useState('entrar')
  const [carregando, setCarregando] = useState(false)
  const [msg, setMsg] = useState(null)

  async function enviar(e) {
    e.preventDefault()
    setCarregando(true)
    setMsg(null)
    const f = new FormData(e.currentTarget)
    const email = f.get('email').trim()
    const senha = f.get('senha')
    const supabase = createClient()

    if (modo === 'entrar') {
      const { error } = await supabase.auth.signInWithPassword({ email, password: senha })
      if (error) {
        setMsg({ tipo: 'erro', texto: 'E-mail ou senha incorretos.' })
        setCarregando(false)
        return
      }
    } else {
      const { data, error } = await supabase.auth.signUp({
        email,
        password: senha,
        options: { data: { nome: f.get('nome').trim(), telefone: f.get('telefone').trim() } },
      })
      if (error) {
        setMsg({ tipo: 'erro', texto: traduzir(error.message) })
        setCarregando(false)
        return
      }
      if (!data.session) {
        setMsg({ tipo: 'ok', texto: 'Conta criada! Confirme pelo link que enviamos no seu e-mail e depois entre.' })
        setModo('entrar')
        setCarregando(false)
        return
      }
    }
    router.replace('/')
    router.refresh()
  }

  return (
    <main className="page">
      <div className="marca">
        <img src="/icons/icon-192.png" alt="" />
        <h1>Escala Igreja Viver</h1>
        <p>Veja quando você serve e receba o aviso no celular.</p>
      </div>

      <div className="card">
        <div className="abas" role="tablist">
          <button type="button" className={modo === 'entrar' ? 'ativa' : ''} onClick={() => setModo('entrar')}>
            Entrar
          </button>
          <button type="button" className={modo === 'cadastro' ? 'ativa' : ''} onClick={() => setModo('cadastro')}>
            Criar conta
          </button>
        </div>

        <form onSubmit={enviar}>
          {modo === 'cadastro' && (
            <>
              <label htmlFor="nome">Seu nome</label>
              <input id="nome" name="nome" required autoComplete="name" placeholder="Como a liderança te conhece" />
              <label htmlFor="telefone">WhatsApp</label>
              <input id="telefone" name="telefone" inputMode="tel" autoComplete="tel" placeholder="(16) 99999-9999" />
            </>
          )}
          <label htmlFor="email">E-mail</label>
          <input id="email" name="email" type="email" required autoComplete="email" />
          <label htmlFor="senha">Senha</label>
          <input
            id="senha"
            name="senha"
            type="password"
            required
            minLength={6}
            autoComplete={modo === 'entrar' ? 'current-password' : 'new-password'}
          />
          <button className="btn full" disabled={carregando}>
            {carregando ? 'Aguarde...' : modo === 'entrar' ? 'Entrar' : 'Criar minha conta'}
          </button>
        </form>

        {msg && <p className={`aviso ${msg.tipo}`}>{msg.texto}</p>}
      </div>
    </main>
  )
}

function traduzir(m) {
  if (/already registered/i.test(m)) return 'Esse e-mail já tem conta. Use a aba Entrar.'
  if (/at least 6/i.test(m)) return 'A senha precisa ter pelo menos 6 caracteres.'
  return 'Não foi possível criar a conta. Tente de novo.'
}
