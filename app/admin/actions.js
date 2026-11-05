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

function atualizar() {
  revalidatePath('/admin')
  revalidatePath('/')
}

export async function criarEscala(formData) {
  const { supabase } = await exigirAdmin()
  const membros = formData.getAll('membros')
  const nomes = (formData.get('nomes') || '')
    .split(/[,;\n]/)
    .map((n) => n.trim())
    .filter(Boolean)
  if (!membros.length && !nomes.length) return
  const base = {
    data: formData.get('data'),
    horario: formData.get('horario') || null,
    ministerio_id: formData.get('ministerio_id'),
    funcao: formData.get('funcao')?.trim() || null,
    observacao: formData.get('observacao')?.trim() || null,
  }
  const linhas = [
    ...membros.map((membro_id) => ({ ...base, membro_id })),
    ...nomes.map((membro_nome) => ({ ...base, membro_nome })),
  ]
  await supabase.from('escalas').insert(linhas)
  atualizar()
}

export async function removerEscala(formData) {
  const { supabase } = await exigirAdmin()
  await supabase.from('escalas').delete().eq('id', formData.get('id'))
  atualizar()
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

// Liga todas as escalas de um nome (sem conta) a uma pessoa cadastrada
export async function vincularNome(formData) {
  const { supabase } = await exigirAdmin()
  const nome = formData.get('nome')
  const membro_id = formData.get('membro_id')
  if (!nome || !membro_id) return
  await supabase.from('escalas').update({ membro_id }).is('membro_id', null).eq('membro_nome', nome)
  atualizar()
}

export async function criarAviso(formData) {
  const { supabase } = await exigirAdmin()
  const titulo = formData.get('titulo')?.trim()
  const data = formData.get('data')
  if (!titulo || !data) return
  await supabase.from('avisos').insert({
    titulo,
    data,
    horario: formData.get('horario') || null,
    descricao: formData.get('descricao')?.trim() || null,
  })
  atualizar()
}

export async function removerAviso(formData) {
  const { supabase } = await exigirAdmin()
  await supabase.from('avisos').delete().eq('id', formData.get('id'))
  atualizar()
}
