-- Record delivery only after the receiver has installed the Personal Voice in
-- AlarmKit. Sending/uploading alone must not count as delivery.

alter table public.voice_messages
  add column if not exists alarm_received_at timestamptz;

create index if not exists voice_messages_sender_alarm_received_idx
  on public.voice_messages (sender_id, alarm_received_at, created_at desc)
  where type = 'personal';

create or replace function public.acknowledge_personal_voice_alarm(
  p_voice_id uuid,
  p_morning_request_id uuid
)
returns timestamptz
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_receiver_id uuid := auth.uid();
  v_received_at timestamptz;
begin
  if v_receiver_id is null then
    raise exception 'Authentication is required';
  end if;

  update public.voice_messages
  set alarm_received_at = coalesce(alarm_received_at, now())
  where id = p_voice_id
    and morning_request_id = p_morning_request_id
    and receiver_id = v_receiver_id
    and type = 'personal'
  returning alarm_received_at into v_received_at;

  if v_received_at is null then
    raise exception 'The Personal Voice was not found for this receiver and request';
  end if;

  return v_received_at;
end;
$$;

revoke execute on function public.acknowledge_personal_voice_alarm(uuid, uuid)
from public, anon;

grant execute on function public.acknowledge_personal_voice_alarm(uuid, uuid)
to authenticated;
