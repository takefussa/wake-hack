-- Compatibility upgrade for projects that already had a community_voices
-- table before migration 014. `create table if not exists` does not add the
-- new columns to an existing table.

alter table public.community_voices
  add column if not exists sender_id uuid references public.profiles (id) on delete cascade,
  add column if not exists storage_path text,
  add column if not exists duration_ms integer not null default 5000,
  add column if not exists voice_style text not null default 'そっと優しく';

alter table public.community_voices enable row level security;
grant select, insert on table public.community_voices to authenticated;

do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'community_voices' and column_name = 'user_id'
  ) then
    execute 'update public.community_voices set sender_id = user_id where sender_id is null';
  end if;

  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'community_voices' and column_name = 'audio_path'
  ) then
    execute 'update public.community_voices set storage_path = audio_path where storage_path is null';
  end if;

  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'community_voices' and column_name = 'file_path'
  ) then
    execute 'update public.community_voices set storage_path = file_path where storage_path is null';
  end if;

  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'community_voices' and column_name = 'style'
  ) then
    execute 'update public.community_voices set voice_style = style where voice_style = ''そっと優しく''';
  end if;
end;
$$;

create index if not exists community_voices_storage_path_idx
  on public.community_voices (storage_path)
  where storage_path is not null;

drop policy if exists "Authenticated users can read community voices" on public.community_voices;
create policy "Authenticated users can read community voices"
on public.community_voices
for select
to authenticated
using (true);

drop policy if exists "Users can add their own community voices" on public.community_voices;
create policy "Users can add their own community voices"
on public.community_voices
for insert
to authenticated
with check ((select auth.uid()) = sender_id);
