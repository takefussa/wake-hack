-- Wake Hack Supabase Phase 4: mutual morning-friend intent.

create table if not exists public.friendships (
  id uuid primary key default gen_random_uuid(),
  user_a_id uuid not null references public.profiles (id) on delete cascade,
  user_b_id uuid not null references public.profiles (id) on delete cascade,
  user_a_requested boolean not null default false,
  user_b_requested boolean not null default false,
  status text not null default 'pending',
  morning_count integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint friendships_pair_unique unique (user_a_id, user_b_id),
  constraint friendships_canonical_pair_check check (
    user_a_id::text < user_b_id::text
  ),
  constraint friendships_status_check check (status in ('pending', 'matched')),
  constraint friendships_morning_count_check check (morning_count >= 1),
  constraint friendships_intent_status_check check (
    (
      status = 'pending'
      and user_a_requested <> user_b_requested
    )
    or (
      status = 'matched'
      and user_a_requested
      and user_b_requested
    )
  )
);

create index if not exists friendships_user_a_status_idx
  on public.friendships (user_a_id, status, updated_at desc);

create index if not exists friendships_user_b_status_idx
  on public.friendships (user_b_id, status, updated_at desc);

alter table public.friendships enable row level security;

revoke all on table public.friendships from anon, authenticated;
grant select on table public.friendships to authenticated;

drop policy if exists "Friendship participants can read rows" on public.friendships;
create policy "Friendship participants can read rows"
on public.friendships
for select
to authenticated
using (
  (select auth.uid()) = user_a_id
  or (select auth.uid()) = user_b_id
);

create or replace function public.request_friendship(
  p_other_user_id uuid,
  p_source_voice_message_id uuid
)
returns setof public.friendships
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_requester_id uuid := auth.uid();
  v_user_a_id uuid;
  v_user_b_id uuid;
  v_user_a_requested boolean;
  v_user_b_requested boolean;
  v_friendship public.friendships;
begin
  if v_requester_id is null then
    raise exception 'Authentication is required';
  end if;

  if p_other_user_id = v_requester_id then
    raise exception 'A friendship cannot be requested with yourself';
  end if;

  perform 1
  from public.voice_messages as voice
  where voice.id = p_source_voice_message_id
    and voice.type = 'personal'
    and voice.receiver_id = v_requester_id
    and voice.sender_id = p_other_user_id;

  if not found then
    raise exception 'A received Personal Voice is required';
  end if;

  if v_requester_id::text < p_other_user_id::text then
    v_user_a_id := v_requester_id;
    v_user_b_id := p_other_user_id;
    v_user_a_requested := true;
    v_user_b_requested := false;
  else
    v_user_a_id := p_other_user_id;
    v_user_b_id := v_requester_id;
    v_user_a_requested := false;
    v_user_b_requested := true;
  end if;

  insert into public.friendships as existing (
    user_a_id,
    user_b_id,
    user_a_requested,
    user_b_requested,
    status,
    morning_count
  )
  values (
    v_user_a_id,
    v_user_b_id,
    v_user_a_requested,
    v_user_b_requested,
    'pending',
    1
  )
  on conflict (user_a_id, user_b_id) do update
  set user_a_requested = existing.user_a_requested or excluded.user_a_requested,
      user_b_requested = existing.user_b_requested or excluded.user_b_requested,
      status = case
        when (existing.user_a_requested or excluded.user_a_requested)
          and (existing.user_b_requested or excluded.user_b_requested)
        then 'matched'
        else 'pending'
      end,
      updated_at = now()
  returning existing.* into v_friendship;

  return next v_friendship;
  return;
end;
$$;

revoke execute on function public.request_friendship(uuid, uuid)
from public, anon;

grant execute on function public.request_friendship(uuid, uuid)
to authenticated;
