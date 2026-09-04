-- Wake Hack Supabase Phase 6: community voice posting, delivery, and thanks.

create table if not exists public.community_voices (
  id uuid primary key,
  sender_id uuid not null references public.profiles (id) on delete cascade,
  audio_path text not null unique,
  duration_ms integer not null,
  wake_style text not null,
  moderation_status text not null default 'pending',
  play_count integer not null default 0,
  thanks_count integer not null default 0,
  created_at timestamptz not null default now(),
  constraint community_voices_duration_check check (duration_ms between 2000 and 10000),
  constraint community_voices_wake_style_check check (
    wake_style in ('gentle', 'cheerful', 'strict', 'funny')
  ),
  constraint community_voices_moderation_status_check check (
    moderation_status in ('pending', 'approved', 'rejected')
  )
);

create index if not exists community_voices_feed_idx
  on public.community_voices (wake_style, created_at desc)
  where moderation_status = 'approved';

create index if not exists community_voices_sender_created_at_idx
  on public.community_voices (sender_id, created_at desc);

create table if not exists public.community_voice_thanks (
  id uuid primary key default gen_random_uuid(),
  voice_id uuid not null references public.community_voices (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (voice_id, user_id)
);

create index if not exists community_voice_thanks_user_idx
  on public.community_voice_thanks (user_id, created_at desc);

create table if not exists public.community_voice_deliveries (
  id uuid primary key default gen_random_uuid(),
  voice_id uuid not null references public.community_voices (id) on delete cascade,
  receiver_id uuid not null references public.profiles (id) on delete cascade,
  delivered_at timestamptz not null default now(),
  played_at timestamptz,
  unique (voice_id, receiver_id)
);

create index if not exists community_voice_deliveries_receiver_idx
  on public.community_voice_deliveries (receiver_id, delivered_at desc);

alter table public.community_voices enable row level security;
alter table public.community_voice_thanks enable row level security;
alter table public.community_voice_deliveries enable row level security;

revoke all on table public.community_voices from anon, authenticated;
revoke all on table public.community_voice_thanks from anon, authenticated;
revoke all on table public.community_voice_deliveries from anon, authenticated;

grant select, insert, update, delete on table public.community_voices to authenticated;
grant select, insert on table public.community_voice_thanks to authenticated;
grant select, insert, update on table public.community_voice_deliveries to authenticated;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'community-voices',
  'community-voices',
  false,
  2097152,
  array['audio/mp4', 'audio/m4a', 'audio/x-m4a', 'audio/webm']
)
on conflict (id) do update
set public = false,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Approved community voices are readable" on public.community_voices;
create policy "Approved community voices are readable"
on public.community_voices
for select
to authenticated
using (moderation_status = 'approved' or sender_id = (select auth.uid()));

drop policy if exists "Community voice senders can insert their own voices" on public.community_voices;
create policy "Community voice senders can insert their own voices"
on public.community_voices
for insert
to authenticated
with check (sender_id = (select auth.uid()));

drop policy if exists "Community voice senders can update their own voices" on public.community_voices;
create policy "Community voice senders can update their own voices"
on public.community_voices
for update
to authenticated
using (sender_id = (select auth.uid()))
with check (sender_id = (select auth.uid()));

drop policy if exists "Community voice senders can delete their own voices" on public.community_voices;
create policy "Community voice senders can delete their own voices"
on public.community_voices
for delete
to authenticated
using (sender_id = (select auth.uid()));

drop policy if exists "Community voice users can read their thanks" on public.community_voice_thanks;
create policy "Community voice users can read their thanks"
on public.community_voice_thanks
for select
to authenticated
using (
  user_id = (select auth.uid())
  or exists (
    select 1
    from public.community_voices as voice
    where voice.id = voice_id
      and voice.sender_id = (select auth.uid())
  )
);

drop policy if exists "Community voice users can thank once" on public.community_voice_thanks;
create policy "Community voice users can thank once"
on public.community_voice_thanks
for insert
to authenticated
with check (user_id = (select auth.uid()));

drop policy if exists "Community delivery participants can read" on public.community_voice_deliveries;
create policy "Community delivery participants can read"
on public.community_voice_deliveries
for select
to authenticated
using (
  receiver_id = (select auth.uid())
  or exists (
    select 1
    from public.community_voices as voice
    where voice.id = voice_id
      and voice.sender_id = (select auth.uid())
  )
);

drop policy if exists "Community receivers can update played at" on public.community_voice_deliveries;
create policy "Community receivers can update played at"
on public.community_voice_deliveries
for update
to authenticated
using (receiver_id = (select auth.uid()))
with check (receiver_id = (select auth.uid()));

drop policy if exists "Community voice senders can upload their own files" on storage.objects;
create policy "Community voice senders can upload their own files"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'community-voices'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

drop policy if exists "Community approved files can be read" on storage.objects;
create policy "Community approved files can be read"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'community-voices'
  and (
    (storage.foldername(name))[1] = (select auth.uid())::text
    or exists (
      select 1
      from public.community_voices as voice
      where voice.audio_path = name
        and voice.moderation_status = 'approved'
    )
  )
);

drop policy if exists "Community voice senders can remove failed uploads" on storage.objects;
create policy "Community voice senders can remove failed uploads"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'community-voices'
  and owner_id = (select auth.uid())::text
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

create or replace function public.create_community_voice(
  p_voice_id uuid,
  p_audio_path text,
  p_duration_ms integer,
  p_wake_style text,
  p_moderation_status text default 'approved'
)
returns setof public.community_voices
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_sender_id uuid := auth.uid();
  v_voice public.community_voices;
  v_expected_prefix text;
begin
  if v_sender_id is null then
    raise exception 'Authentication is required';
  end if;

  if p_duration_ms < 2000 or p_duration_ms > 10000 then
    raise exception 'Recording duration is outside the allowed range';
  end if;

  if p_wake_style not in ('gentle', 'cheerful', 'strict', 'funny') then
    raise exception 'Wake style is invalid';
  end if;

  if p_moderation_status not in ('pending', 'approved', 'rejected') then
    raise exception 'Moderation status is invalid';
  end if;

  v_expected_prefix := v_sender_id::text || '/';
  if p_audio_path <> format('%s%s.m4a', v_expected_prefix, p_voice_id) then
    raise exception 'Storage path does not match the voice sender';
  end if;

  if not exists (
    select 1
    from storage.objects as object
    where object.bucket_id = 'community-voices'
      and object.name = p_audio_path
      and object.owner_id = v_sender_id::text
  ) then
    raise exception 'The uploaded community voice file was not found';
  end if;

  insert into public.community_voices (
    id,
    sender_id,
    audio_path,
    duration_ms,
    wake_style,
    moderation_status
  )
  values (
    p_voice_id,
    v_sender_id,
    p_audio_path,
    p_duration_ms,
    p_wake_style,
    p_moderation_status
  )
  returning * into v_voice;

  return next v_voice;
  return;
end;
$$;

revoke execute on function public.create_community_voice(
  uuid, text, integer, text, text
) from public, anon;
grant execute on function public.create_community_voice(
  uuid, text, integer, text, text
) to authenticated;

create or replace function public.assign_community_voice(
  p_wake_style text
)
returns table (
  delivery_id uuid,
  id uuid,
  sender_id uuid,
  audio_path text,
  duration_ms integer,
  wake_style text,
  moderation_status text,
  play_count integer,
  thanks_count integer,
  created_at timestamptz
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_receiver_id uuid := auth.uid();
  v_voice public.community_voices;
  v_delivery public.community_voice_deliveries;
begin
  if v_receiver_id is null then
    raise exception 'Authentication is required';
  end if;

  select voice.*
  into v_voice
  from public.community_voices as voice
  where voice.moderation_status = 'approved'
    and voice.wake_style = p_wake_style
    and voice.sender_id <> v_receiver_id
  order by
    exists (
      select 1
      from public.community_voice_deliveries as delivery
      where delivery.voice_id = voice.id
        and delivery.receiver_id = v_receiver_id
    ) asc,
    random()
  limit 1;

  if v_voice.id is null then
    return;
  end if;

  insert into public.community_voice_deliveries (voice_id, receiver_id)
  values (v_voice.id, v_receiver_id)
  on conflict (voice_id, receiver_id) do update
  set delivered_at = now()
  returning * into v_delivery;

  delivery_id := v_delivery.id;
  id := v_voice.id;
  sender_id := v_voice.sender_id;
  audio_path := v_voice.audio_path;
  duration_ms := v_voice.duration_ms;
  wake_style := v_voice.wake_style;
  moderation_status := v_voice.moderation_status;
  play_count := v_voice.play_count;
  thanks_count := v_voice.thanks_count;
  created_at := v_voice.created_at;
  return next;
end;
$$;

revoke execute on function public.assign_community_voice(text) from public, anon;
grant execute on function public.assign_community_voice(text) to authenticated;

create or replace function public.mark_community_voice_played(
  p_delivery_id uuid
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_receiver_id uuid := auth.uid();
  v_voice_id uuid;
  v_was_unplayed boolean;
begin
  if v_receiver_id is null then
    raise exception 'Authentication is required';
  end if;

  select delivery.voice_id, delivery.played_at is null
  into v_voice_id, v_was_unplayed
  from public.community_voice_deliveries as delivery
  where delivery.id = p_delivery_id
    and delivery.receiver_id = v_receiver_id
  for update;

  if v_voice_id is null then
    raise exception 'Delivery was not found';
  end if;

  update public.community_voice_deliveries
  set played_at = coalesce(played_at, now())
  where id = p_delivery_id;

  if v_was_unplayed then
    update public.community_voices
    set play_count = play_count + 1
    where id = v_voice_id;
  end if;
end;
$$;

revoke execute on function public.mark_community_voice_played(uuid) from public, anon;
grant execute on function public.mark_community_voice_played(uuid) to authenticated;

create or replace function public.thank_community_voice(
  p_voice_id uuid
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_inserted_count integer;
begin
  if v_user_id is null then
    raise exception 'Authentication is required';
  end if;

  insert into public.community_voice_thanks (voice_id, user_id)
  values (p_voice_id, v_user_id)
  on conflict (voice_id, user_id) do nothing;

  get diagnostics v_inserted_count = row_count;

  if v_inserted_count > 0 then
    update public.community_voices
    set thanks_count = thanks_count + 1
    where id = p_voice_id;
  end if;
end;
$$;

revoke execute on function public.thank_community_voice(uuid) from public, anon;
grant execute on function public.thank_community_voice(uuid) to authenticated;
