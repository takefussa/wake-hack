-- Fix Personal Voice delivery after the social/alarm merge.
-- The receiver's request is the one whose alarm should use the voice.

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
      personal_eligible = true,
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
