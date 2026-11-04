'use client'

import { useEffect, useState } from 'react'

function base64ParaUint8(b64) {
  const padding = '='.repeat((4 - (b64.length % 4)) % 4)
  const raw = atob((b64 + padding).replace(/-/g, '+').replace(/_/g, '/'))
  return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)))
}

export default function AtivarAvisos() {
  const [estado, setEstado] = useState('carregando') // carregando | sem-suporte | iphone | desativado | ativo | bloqueado
  const [msg, setMsg] = useState(null)
  const [ocupado, setOcupado] = useState(false)

  useEffect(() => {
    ;(async () => {
      const ios = /iphone|ipad|ipod/i.test(navigator.userAgent)
      const instalado =
        window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true

      if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
        setEstado(ios && !instalado ? 'iphone' : 'sem-suporte')
        return
      }
      const reg = await navigator.serviceWorker.register('/sw.js')
      if (Notification.permission === 'denied') return setEstado('bloqueado')
      const sub = await reg.pushManager.getSubscription()
      setEstado(sub ? 'ativo' : 'desativado')
    })().catch(() => setEstado('sem-suporte'))
  }, [])

  async function ativar() {
    setOcupado(true)
    setMsg(null)
    try {
      const permissao = await Notification.requestPermission()
      if (permissao !== 'granted') {
        setEstado(permissao === 'denied' ? 'bloqueado' : 'desativado')
        return
      }
      const reg = await navigator.serviceWorker.ready
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: base64ParaUint8(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY),
      })
      const r = await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sub),
      })
      if (!r.ok) throw new Error()
      setEstado('ativo')
      setMsg({ tipo: 'ok', texto: 'Pronto! Você vai receber o aviso na véspera e no dia da sua escala.' })
    } catch {
      setMsg({ tipo: 'erro', texto: 'Não deu para ativar agora. Tente de novo.' })
    } finally {
      setOcupado(false)
    }
  }

  async function testar() {
    setOcupado(true)
    const r = await fetch('/api/push/test', { method: 'POST' })
    setMsg(
      r.ok
        ? { tipo: 'ok', texto: 'Aviso de teste enviado. Deve chegar em alguns segundos.' }
        : { tipo: 'erro', texto: 'O teste falhou. Desative e ative de novo.' }
    )
    setOcupado(false)
  }

  if (estado === 'carregando') return null

  return (
    <section className="card">
      <h2>Avisos no celular</h2>

      {estado === 'ativo' && (
        <>
          <p style={{ margin: 0 }}>✅ Ativados neste aparelho.</p>
          <button className="btn sec peq" style={{ marginTop: 10 }} onClick={testar} disabled={ocupado}>
            Enviar aviso de teste
          </button>
        </>
      )}

      {estado === 'desativado' && (
        <>
          <p style={{ margin: 0 }}>Ative para ser avisado na véspera e no dia em que você estiver escalado.</p>
          <button className="btn full" onClick={ativar} disabled={ocupado}>
            {ocupado ? 'Ativando...' : 'Ativar avisos'}
          </button>
        </>
      )}

      {estado === 'iphone' && (
        <p className="aviso info">
          No iPhone, os avisos só funcionam com o app na tela inicial: toque em <strong>Compartilhar</strong> (o
          quadrado com a seta) e depois em <strong>Adicionar à Tela de Início</strong>. Abra pelo ícone e ative aqui.
        </p>
      )}

      {estado === 'bloqueado' && (
        <p className="aviso erro">
          As notificações estão bloqueadas para este app. Libere nas configurações do celular ou do navegador e
          recarregue a página.
        </p>
      )}

      {estado === 'sem-suporte' && (
        <p className="aviso info">Este navegador não recebe avisos. Use o Chrome no Android ou o app instalado no iPhone.</p>
      )}

      {msg && <p className={`aviso ${msg.tipo}`}>{msg.texto}</p>}
    </section>
  )
}
