import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { enviarParaPessoa } from '@/lib/push'

export async function POST() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ erro: 'não autenticado' }, { status: 401 })

  const enviados = await enviarParaPessoa(createAdminClient(), user.id, {
    title: 'Aviso de teste ✅',
    body: 'Tudo certo! É assim que você vai ser lembrado da sua escala.',
    url: '/',
  })
  return NextResponse.json({ enviados }, { status: enviados ? 200 : 404 })
}
