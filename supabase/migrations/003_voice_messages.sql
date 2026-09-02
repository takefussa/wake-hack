-- Wake Hack Supabase Phase 3: private personal voice delivery.

create table if not exists public.voice_messages (
  id uuid primary key,
  sender_id uuid not null references public.profiles (id) on delete cascade,
  receiver_id uuid not null references public.profiles (id) on delete cascade,
  morning_request_id uuid not null references public.morning_requests (id) on delete cascade,
  storage_path text not null unique,
  duration_ms integer not null,
  type text not null default 'personal',
  created_at timestamptz not null default now(),
  constraint voice_messages_duration_check check (duration_ms between 2000 and 10000),
  constraint voice_messages_type_check check (type in ('personal', 'community', 'thanks')),
  constraint voice_messages_personal_receiver_check check (sender_id <> receiver_id)
);

create index if not exists voice_messages_receiver_request_created_at_idx
  on public.voice_messages (receiver_id, morning_request_id, created_at asc)
  where type = 'personal';

create index if not exists voice_messages_sender_created_at_idx
  on public.voice_messages (sender_id, created_at desc);

alter table public.voice_messages enable row level security;

revoke all on table public.voice_messages from anon, authenticated;
grant select on table public.voice_messages to authenticated;

drop policy if exists "Voice participants can read personal messages" on public.voice_messages;
create policy "Voice participants can read personal messages"
on public.voice_messages
for select
to authenticated
using ((select auth.uid()) = sender_id or (select auth.uid()) = receiver_id);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'voice-messages',
  'voice-messages',
  false,
  2097152,
  array['audio/mp4', 'audio/m4a', 'audio/x-m4a']
)
on conflict (id) do update
set public = false,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Voice senders can upload their own files" on storage.objects;
create policy "Voice senders can upload their own files"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'voice-messages'
  and (storage.foldername(name))[1] = 'personal'
  and (storage.foldername(name))[3] = (select auth.uid())::text
);

drop policy if exists "Voice participants can read their files" on storage.objects;
create policy "Voice participants can read their files"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'voice-messages'
  and (storage.foldername(name))[1] = 'personal'
  and (
    (storage.foldername(name))[2] = (select auth.uid())::text
    or (storage.foldername(name))[3] = (select auth.uid())::text
  )
);

drop policy if exists "Voice senders can remove failed uploads" on storage.objects;
create policy "Voice senders can remove failed uploads"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'voice-messages'
  and owner_id = (select auth.uid())::text
  and (storage.foldername(name))[1] = 'personal'
  and (storage.foldername(name))[3] = (select auth.uid())::text
);

create or replace function public.send_personal_voice(
  p_voice_id uuid,
  p_receiver_id uuid,
  p_morning_request_id uuid,
  p_sender_morning_request_id uuid,
  p_storage_path text,
  p_duration_ms integer
)
returns setof public.voice_messages
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_sender_id uuid := auth.uid();
  v_target_user_id uuid;
  v_voice public.voice_messages;
  v_expected_path text;
begin
  if v_sender_id is null then
    raise exception 'Authentication is required';
  end if;

  if p_receiver_id = v_sender_id then
    raise exception 'A personal voice cannot be sent to yourself';
  end if;

  if p_duration_ms < 2000 or p_duration_ms > 10000 then
    raise exception 'Recording duration is outside the allowed range';
  end if;

  v_expected_path := format(
    'personal/%s/%s/%s.m4a',
    p_receiver_id,
    v_sender_id,
    p_voice_id
  );

  if p_storage_path <> v_expected_path then
    raise exception 'Storage path does not match the voice participants';
  end if;

  select request.user_id
  into v_target_user_id
  from public.morning_requests as request
  where request.id = p_morning_request_id
    and request.status = 'open'
  for update;

  if v_target_user_id is null or v_target_user_id <> p_receiver_id then
    raise exception 'The target morning request is not available';
  end if;

  perform 1
  from public.morning_requests as request
  where request.id = p_sender_morning_request_id
    and request.user_id = v_sender_id
    and request.status in ('open', 'voice_assigned')
  for update;

  if not found then
    raise exception 'The sender morning request is not available';
  end if;

  if not exists (
    select 1
    from storage.objects as object
    where object.bucket_id = 'voice-messages'
      and object.name = p_storage_path
      and object.owner_id = v_sender_id::text
  ) then
    raise exception 'The uploaded voice file was not found';
  end if;

  insert into public.voice_messages (
    id,
    sender_id,
    receiver_id,
    morning_request_id,
    storage_path,
    duration_ms,
    type
  )
  values (
    p_voice_id,
    v_sender_id,
    p_receiver_id,
    p_morning_request_id,
    p_storage_path,
    p_duration_ms,
    'personal'
  )
  returning * into v_voice;

  update public.morning_requests
  set voice_count = voice_count + 1,
      updated_at = now()
  where id = p_morning_request_id;

  update public.morning_requests
  set personal_eligible = true,
      updated_at = now()
  where id = p_morning_request_id;

  return next v_voice;
  return;
end;
$$;

revoke execute on function public.send_personal_voice(
  uuid, uuid, uuid, uuid, text, integer
) from public, anon;

grant execute on function public.send_personal_voice(
  uuid, uuid, uuid, uuid, text, integer
) to authenticated;
