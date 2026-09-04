-- Wake Hack Supabase Phase 7: AI voice safety checker metadata.

alter table public.voice_messages
  add column if not exists moderation_status text not null default 'approved',
  add column if not exists moderation_category text,
  add column if not exists moderation_reason text,
  add column if not exists moderated_at timestamptz;

alter table public.community_voices
  add column if not exists moderation_category text,
  add column if not exists moderation_reason text,
  add column if not exists moderated_at timestamptz;

alter table public.voice_messages
  drop constraint if exists voice_messages_moderation_status_check;

alter table public.voice_messages
  add constraint voice_messages_moderation_status_check check (
    moderation_status in ('pending', 'approved', 'rejected')
  );

alter table public.voice_messages
  drop constraint if exists voice_messages_moderation_category_check;

alter table public.voice_messages
  add constraint voice_messages_moderation_category_check check (
    moderation_category is null
    or moderation_category in (
      'safe',
      'insult',
      'hate',
      'sexual',
      'threat',
      'harassment',
      'irrelevant',
      'other'
    )
  );

alter table public.community_voices
  drop constraint if exists community_voices_moderation_category_check;

alter table public.community_voices
  add constraint community_voices_moderation_category_check check (
    moderation_category is null
    or moderation_category in (
      'safe',
      'insult',
      'hate',
      'sexual',
      'threat',
      'harassment',
      'irrelevant',
      'other'
    )
  );

create index if not exists voice_messages_receiver_request_approved_idx
  on public.voice_messages (receiver_id, morning_request_id, created_at asc)
  where type = 'personal' and moderation_status = 'approved';

drop function if exists public.send_personal_voice(
  uuid, uuid, uuid, uuid, text, integer
);

create or replace function public.send_personal_voice(
  p_voice_id uuid,
  p_receiver_id uuid,
  p_morning_request_id uuid,
  p_sender_morning_request_id uuid,
  p_storage_path text,
  p_duration_ms integer,
  p_moderation_status text default 'approved',
  p_moderation_category text default 'safe',
  p_moderation_reason text default null
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

  if p_moderation_status <> 'approved' then
    raise exception 'The voice has not been approved';
  end if;

  if p_moderation_category is not null and p_moderation_category not in (
    'safe',
    'insult',
    'hate',
    'sexual',
    'threat',
    'harassment',
    'irrelevant',
    'other'
  ) then
    raise exception 'Moderation category is invalid';
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
    type,
    moderation_status,
    moderation_category,
    moderation_reason,
    moderated_at
  )
  values (
    p_voice_id,
    v_sender_id,
    p_receiver_id,
    p_morning_request_id,
    p_storage_path,
    p_duration_ms,
    'personal',
    'approved',
    coalesce(p_moderation_category, 'safe'),
    nullif(left(coalesce(p_moderation_reason, ''), 240), ''),
    now()
  )
  returning * into v_voice;

  update public.morning_requests
  set voice_count = voice_count + 1,
      updated_at = now()
  where id = p_morning_request_id;

  update public.morning_requests
  set personal_eligible = true,
      updated_at = now()
  where id = p_sender_morning_request_id;

  return next v_voice;
  return;
end;
$$;

revoke execute on function public.send_personal_voice(
  uuid, uuid, uuid, uuid, text, integer, text, text, text
) from public, anon;
grant execute on function public.send_personal_voice(
  uuid, uuid, uuid, uuid, text, integer, text, text, text
) to authenticated;

revoke update on table public.community_voices from authenticated;

drop policy if exists "Community voice senders can update their own voices" on public.community_voices;

create or replace function public.create_community_voice(
  p_voice_id uuid,
  p_audio_path text,
  p_duration_ms integer,
  p_wake_style text,
  p_moderation_status text default 'pending'
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

  if p_moderation_status <> 'pending' then
    raise exception 'Community voices must start as pending';
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
    'pending'
  )
  returning * into v_voice;

  return next v_voice;
  return;
end;
$$;

create or replace function public.update_community_voice_moderation(
  p_voice_id uuid,
  p_moderation_status text,
  p_moderation_category text default null,
  p_moderation_reason text default null
)
returns setof public.community_voices
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_sender_id uuid := auth.uid();
  v_voice public.community_voices;
begin
  if v_sender_id is null then
    raise exception 'Authentication is required';
  end if;

  if p_moderation_status not in ('pending', 'approved', 'rejected') then
    raise exception 'Moderation status is invalid';
  end if;

  if p_moderation_category is not null and p_moderation_category not in (
    'safe',
    'insult',
    'hate',
    'sexual',
    'threat',
    'harassment',
    'irrelevant',
    'other'
  ) then
    raise exception 'Moderation category is invalid';
  end if;

  update public.community_voices
  set moderation_status = p_moderation_status,
      moderation_category = p_moderation_category,
      moderation_reason = nullif(left(coalesce(p_moderation_reason, ''), 240), ''),
      moderated_at = now()
  where id = p_voice_id
    and sender_id = v_sender_id
  returning * into v_voice;

  if v_voice.id is null then
    raise exception 'Community voice was not found';
  end if;

  return next v_voice;
  return;
end;
$$;

revoke execute on function public.update_community_voice_moderation(
  uuid, text, text, text
) from public, anon;
revoke execute on function public.update_community_voice_moderation(
  uuid, text, text, text
) from authenticated;
