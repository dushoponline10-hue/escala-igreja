-- Migração 02: reconhece nomes com sobrenome ou apelido ("João Pedro (JotaP)" pega as escalas de "João Pedro")
create or replace function public.vincular_escalas(p_id uuid, p_nome text)
returns integer language plpgsql security definer set search_path = public as $$
declare n integer; v text := public.nome_normalizado(p_nome);
begin
  update public.escalas e
     set membro_id = p_id
   where e.membro_id is null
     and e.membro_nome is not null
     and (
       public.nome_normalizado(e.membro_nome) = v
       or public.nome_normalizado(e.membro_nome) = split_part(v, ' ', 1)
       or v like public.nome_normalizado(e.membro_nome) || ' %'
     );
  get diagnostics n = row_count;
  return n;
end;
$$;
