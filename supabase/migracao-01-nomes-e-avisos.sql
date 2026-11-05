-- Migração 01: escala por nome (antes da pessoa ter conta) e avisos gerais

create extension if not exists unaccent with schema extensions;

-- Escala pode ter só o nome, até a pessoa criar a conta
alter table public.escalas alter column membro_id drop not null;
alter table public.escalas add column if not exists membro_nome text;

-- "João Pedro" == "joao pedro"
create or replace function public.nome_normalizado(t text)
returns text language sql immutable set search_path = public, extensions as $$
  select lower(extensions.unaccent(btrim(coalesce(t, ''))));
$$;

-- Liga as escalas pelo nome a uma conta (nome completo ou primeiro nome)
create or replace function public.vincular_escalas(p_id uuid, p_nome text)
returns integer language plpgsql security definer set search_path = public as $$
declare n integer;
begin
  update public.escalas
     set membro_id = p_id
   where membro_id is null
     and membro_nome is not null
     and public.nome_normalizado(membro_nome) in (
       public.nome_normalizado(p_nome),
       public.nome_normalizado(split_part(btrim(p_nome), ' ', 1))
     );
  get diagnostics n = row_count;
  return n;
end;
$$;

-- Cadastro: cria o perfil (primeira pessoa vira admin) e já vincula as escalas
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare v_nome text := coalesce(new.raw_user_meta_data->>'nome', '');
begin
  insert into public.profiles (id, nome, telefone, is_admin)
  values (
    new.id,
    v_nome,
    new.raw_user_meta_data->>'telefone',
    not exists (select 1 from public.profiles where is_admin)
  )
  on conflict (id) do nothing;
  perform public.vincular_escalas(new.id, v_nome);
  return new;
end;
$$;

-- Avisos gerais (todos recebem): ex. lavar a igreja
create table if not exists public.avisos (
  id uuid primary key default gen_random_uuid(),
  titulo text not null,
  data date not null,
  horario text,
  descricao text,
  created_at timestamptz not null default now()
);

create table if not exists public.avisos_enviados (
  aviso_id uuid not null references public.avisos(id) on delete cascade,
  tipo text not null check (tipo in ('vespera', 'dia')),
  enviado_em timestamptz not null default now(),
  primary key (aviso_id, tipo)
);

alter table public.avisos enable row level security;
alter table public.avisos_enviados enable row level security;

drop policy if exists "ver avisos" on public.avisos;
create policy "ver avisos" on public.avisos
  for select to authenticated using (true);
drop policy if exists "admin avisos" on public.avisos;
create policy "admin avisos" on public.avisos
  for all to authenticated using (public.is_admin()) with check (public.is_admin());
