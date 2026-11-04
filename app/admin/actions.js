'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

async function exigirAdmin() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('Não autenticado')
  const { data } = await supabase.from('profiles').select('is_admin').eq('id', user.id).single()
  if (!data?.is_admin) throw new Error('Sem permissão')
  return { supabase, user }
}

export async function criarEscala(formData) {
  const { supabase } = await exigirAdmin()
  const membros = formData.getAll('membros')
  if (!membros.length) return
  const base = {
    data: formData.get('data'),
    horario: formData.get('horario') || null,
    ministerio_id: formData.get('ministerio_id'),
    funcao: formData.get('funcao')?.trim() || null,
    observacao: formData.get('observacao')?.trim() || null,
  }
  await supabase.from('escalas').insert(membros.map((membro_id) => ({ ...base, membro_id })))
  revalidatePath('/admin')
  revalidatePath('/')
}

export async function removerEscala(formData) {
  const { supabase } = await exigirAdmin()
  await supabase.from('escalas').delete().eq('id', formData.get('id'))
  revalidatePath('/admin')
  revalidatePath('/')
}

export async function criarMinisterio(formData) {
  const { supabase } = await exigirAdmin()
  const nome = formData.get('nome')?.trim()
  if (nome) await supabase.from('ministerios').insert({ nome })
  revalidatePath('/admin')
}

export async function removerMinisterio(formData) {
  const { supabase } = await exigirAdmin()
  await supabase.from('ministerios').delete().eq('id', formData.get('id'))
  revalidatePath('/admin')
}

export async function alternarAdmin(formData) {
  const { user } = await exigirAdmin()
  const id = formData.get('id')
  if (id === user.id) return // não tira o próprio acesso
  const admin = createAdminClient()
  await admin.from('profiles').update({ is_admin: formData.get('valor') === 'true' }).eq('id', id)
  revalidatePath('/admin')
}
