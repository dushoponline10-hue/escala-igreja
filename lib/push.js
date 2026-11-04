import webpush from 'web-push'

let configurado = false

function configurar() {
  if (configurado) return
  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT || 'mailto:escala@igrejaviver.app',
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  )
  configurado = true
}

// Envia para todos os celulares de uma pessoa. Remove inscrições que não valem mais.
export async function enviarParaPessoa(admin, userId, payload) {
  configurar()
  const { data: subs } = await admin
    .from('push_subscriptions')
    .select('id, endpoint, p256dh, auth')
    .eq('user_id', userId)

  let enviados = 0
  for (const s of subs || []) {
    try {
      await webpush.sendNotification(
        { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
        JSON.stringify(payload)
      )
      enviados++
    } catch (err) {
      if (err.statusCode === 404 || err.statusCode === 410) {
        await admin.from('push_subscriptions').delete().eq('id', s.id)
      } else {
        console.error('Falha ao enviar push', err.statusCode, err.body)
      }
    }
  }
  return enviados
}
