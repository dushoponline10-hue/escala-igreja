import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ erro: 'não autenticado' }, { status: 401 })

  const sub = await request.json()
  if (!sub?.endpoint || !sub?.keys?.p256dh || !sub?.keys?.auth) {
    return NextResponse.json({ erro: 'inscrição inválida' }, { status: 400 })
  }

  // Se o aparelho já estava ligado a outra conta, troca para esta
  await supabase.from('push_subscriptions').delete().eq('endpoint', sub.endpoint)
  const { error } = await supabase.from('push_subscriptions').insert({
    user_id: user.id,
    endpoint: sub.endpoint,
    p256dh: sub.keys.p256dh,
    auth: sub.keys.auth,
  })
  if (error) {
    // endpoint pertence a outra conta (RLS impede apagar): usa o acesso de servidor
    const { createAdminClient } = await import('@/lib/supabase/admin')
    const admin = createAdminClient()
    await admin.from('push_subscriptions').upsert(
      { user_id: user.id, endpoint: sub.endpoint, p256dh: sub.keys.p256dh, auth: sub.keys.auth },
      { onConflict: 'endpoint' }
    )
  }
  return NextResponse.json({ ok: true })
}
