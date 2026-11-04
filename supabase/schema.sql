-- Escala Igreja Viver — estrutura do banco
-- Pode rodar mais de uma vez sem quebrar nada.

-- Pessoas (ligadas ao login)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  nome text not null default '',
  telefone text,
  is_admin boolean not null default false,
  created_at timestamptz not null default now()
);

-- Ministérios (Louvor, Mídia, Recepção, Kids...)
create table if not exists public.ministerios (
  id uuid primary key default gen_random_uuid(),
  nome text not null unique,
  created_at timestamptz not null default now()
);

-- Escalas: uma linha por pessoa escalada
create table if not exists public.escalas (
  id uuid primary key default gen_random_uuid(),
  data date not null,
  horario text,
  ministerio_id uuid not null references public.ministerios(id) on delete cascade,
  funcao text,
  membro_id uuid not null references public.profiles(id) on delete cascade,
  observacao text,
  created_at timestamptz not null default now()
);
create index if not exists escalas_data_idx on public.escalas (data);
create index if not exists escalas_membro_idx on public.escalas (membro_id);

-- Celulares inscritos para receber aviso
create table if not exists public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  created_at timestamptz not null default now()
);

-- Controle para não mandar o mesmo aviso duas vezes
create table if not exists public.notificacoes_enviadas (
  escala_id uuid not null references public.escalas(id) on delete cascade,
  tipo text not null check (tipo in ('vespera', 'dia')),
  enviado_em timestamptz not null default now(),
  primary key (escala_id, tipo)
);

-- Quem é admin?
create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce((select is_admin from public.profiles where id = auth.uid()), false);
$$;

-- Cria o perfil quando alguém se cadastra. A primeira pessoa vira admin.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, nome, telefone, is_admin)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'nome', ''),
    new.raw_user_meta_data->>'telefone',
    not exists (select 1 from public.profiles where is_admin)
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Segurança (RLS)
alter table public.profiles enable row level security;
alter table public.ministerios enable row level security;
alter table public.escalas enable row level security;
alter table public.push_subscriptions enable row level security;
alter table public.notificacoes_enviadas enable row level security;

drop policy if exists "perfis visiveis" on public.profiles;
create policy "perfis visiveis" on public.profiles
  for select to authenticated using (true);
drop policy if exists "editar proprio perfil" on public.profiles;
create policy "editar proprio perfil" on public.profiles
  for update to authenticated using (id = auth.uid()) with check (id = auth.uid());
-- Ninguém se promove a admin sozinho
revoke update on public.profiles from authenticated;
grant update (nome, telefone) on public.profiles to authenticated;

drop policy if exists "ver ministerios" on public.ministerios;
create policy "ver ministerios" on public.ministerios
  for select to authenticated using (true);
drop policy if exists "admin ministerios" on public.ministerios;
create policy "admin ministerios" on public.ministerios
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "ver escalas" on public.escalas;
create policy "ver escalas" on public.escalas
  for select to authenticated using (true);
drop policy if exists "admin escalas" on public.escalas;
create policy "admin escalas" on public.escalas
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "minhas inscricoes" on public.push_subscriptions;
create policy "minhas inscricoes" on public.push_subscriptions
  for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Ministérios iniciais (edite à vontade no painel)
insert into public.ministerios (nome) values
  ('Louvor'), ('Mídia'), ('Recepção'), ('Kids'), ('Intercessão')
on conflict (nome) do nothing;
