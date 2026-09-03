-- Persist exactly one Wake Voice assignment and one Wake Session per morning.

create table if not exists public.wake_assignments (
  id uuid primary key default gen_random_uuid(),
  morning_request_id uuid not null unique
    references public.morning_requests (id) on delete cascade,
  voice_message_id uuid unique
    references public.voice_messages (id) on delete restrict,
  type text not null,
  community_voice_id text,
  assigned_at timestamptz not null default now(),
  constraint wake_assignments_type_check check (
    type in ('personal', 'community')
  ),
  constraint wake_assignments_source_check check (
    (
      type = 'personal'
      and voice_message_id is not null
      and community_voice_id is null
    )
    or (
      type = 'community'
      and voice_message_id is null
      and length(btrim(community_voice_id)) > 0
    )
  )
);

create index if not exists wake_assignments_assigned_at_idx
  on public.wake_assignments (assigned_at desc);

alter table public.wake_assignments enable row level security;

revoke all on table public.wake_assignments from anon, authenticated;
grant select on table public.wake_assignments to authenticated;

drop policy if exists "Users can read their own Wake assignment"
on public.wake_assignments;
create policy "Users can read their own Wake assignment"
on public.wake_assignments
for select
to authenticated
using (
  exists (
    select 1
    from public.morning_requests as request
    where request.id = wake_assignments.morning_request_id
      and request.user_id = (select auth.uid())
  )
);

create or replace function public.assign_wake_voice(
  p_morning_request_id uuid
)
returns setof public.wake_assignments
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_request public.morning_requests;
  v_assignment public.wake_assignments;
  v_voice_message_id uuid;
begin
  if v_user_id is null then
    raise exception 'Authentication is required';
  end if;

  select *
  into v_request
  from public.morning_requests
  where id = p_morning_request_id
    and user_id = v_user_id
  for update;

  if not found then
    raise exception 'Morning request was not found';
  end if;

  select *
  into v_assignment
  from public.wake_assignments
  where morning_request_id = p_morning_request_id;

  if found then
    return next v_assignment;
    return;
  end if;

  if v_request.status not in ('open', 'voice_assigned') then
    raise exception 'Morning request cannot be assigned in its current state';
  end if;

  if v_request.personal_eligible then
    select voice.id
    into v_voice_message_id
    from public.voice_messages as voice
    where voice.morning_request_id = p_morning_request_id
      and voice.receiver_id = v_user_id
      and voice.type = 'personal'
    order by
      exists (
        select 1
        from public.friendships as friendship
        where friendship.status = 'matched'
          and (
            (
              friendship.user_a_id = voice.sender_id
              and friendship.user_b_id = v_user_id
            )
            or (
              friendship.user_a_id = v_user_id
              and friendship.user_b_id = voice.sender_id
            )
          )
      ) desc,
      voice.created_at asc
    limit 1;
  end if;

  if v_voice_message_id is not null then
    insert into public.wake_assignments (
      morning_request_id,
      voice_message_id,
      type
    )
    values (
      p_morning_request_id,
      v_voice_message_id,
      'personal'
    )
    returning * into v_assignment;
  else
    insert into public.wake_assignments (
      morning_request_id,
      type,
      community_voice_id
    )
    values (
      p_morning_request_id,
      'community',
      'community-voice-1'
    )
    returning * into v_assignment;
  end if;

  update public.morning_requests
  set status = 'voice_assigned',
      updated_at = now()
  where id = p_morning_request_id;

  return next v_assignment;
  return;
end;
$$;

revoke execute on function public.assign_wake_voice(uuid)
from public, anon;

grant execute on function public.assign_wake_voice(uuid)
to authenticated;

create table if not exists public.wake_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  morning_request_id uuid not null unique
    references public.morning_requests (id) on delete cascade,
  wake_assignment_id uuid not null unique
    references public.wake_assignments (id) on delete cascade,
  wake_voice_key text not null,
  alarm_at timestamptz not null,
  woke_at timestamptz,
  mission_completed boolean not null default false,
  status text not null default 'ringing',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint wake_sessions_status_check check (
    status in ('scheduled', 'ringing', 'completed')
  ),
  constraint wake_sessions_completion_check check (
    (
      status = 'completed'
      and mission_completed
      and woke_at is not null
    )
    or status <> 'completed'
  )
);

create index if not exists wake_sessions_user_created_at_idx
  on public.wake_sessions (user_id, created_at desc);

alter table public.wake_sessions enable row level security;

revoke all on table public.wake_sessions from anon, authenticated;
grant select, insert, update, delete on table public.wake_sessions to authenticated;

drop policy if exists "Users can read their own Wake sessions"
on public.wake_sessions;
create policy "Users can read their own Wake sessions"
on public.wake_sessions
for select
to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "Users can create their own Wake sessions"
on public.wake_sessions;
create policy "Users can create their own Wake sessions"
on public.wake_sessions
for insert
to authenticated
with check (
  (select auth.uid()) = user_id
  and exists (
    select 1
    from public.morning_requests as request
    where request.id = wake_sessions.morning_request_id
      and request.user_id = (select auth.uid())
  )
  and exists (
    select 1
    from public.wake_assignments as assignment
    where assignment.id = wake_sessions.wake_assignment_id
      and assignment.morning_request_id = wake_sessions.morning_request_id
  )
);

drop policy if exists "Users can update their own Wake sessions"
on public.wake_sessions;
create policy "Users can update their own Wake sessions"
on public.wake_sessions
for update
to authenticated
using (
  (select auth.uid()) = user_id
  and status <> 'completed'
)
with check (
  (select auth.uid()) = user_id
  and exists (
    select 1
    from public.morning_requests as request
    where request.id = wake_sessions.morning_request_id
      and request.user_id = (select auth.uid())
  )
  and exists (
    select 1
    from public.wake_assignments as assignment
    where assignment.id = wake_sessions.wake_assignment_id
      and assignment.morning_request_id = wake_sessions.morning_request_id
  )
);

drop policy if exists "Users can delete their own Wake sessions"
on public.wake_sessions;
create policy "Users can delete their own Wake sessions"
on public.wake_sessions
for delete
to authenticated
using (
  (select auth.uid()) = user_id
  and status <> 'completed'
);
