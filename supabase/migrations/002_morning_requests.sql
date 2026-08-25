-- Wake Hack Supabase Phase 2: morning requests.

create table if not exists public.morning_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  wake_at timestamptz not null,
  schedules text[] not null,
  mood text not null,
  preferred_voice_style text not null,
  personal_eligible boolean not null default false,
  voice_count integer not null default 0,
  status text not null default 'open',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint morning_requests_schedules_check check (
    cardinality(schedules) > 0
    and schedules <@ array[
      '1限', '授業', '試験', '発表', '面接', '仕事', '朝活', '旅行', '特にない'
    ]::text[]
    and (
      not ('特にない' = any(schedules))
      or cardinality(schedules) = 1
    )
  ),
  constraint morning_requests_mood_check check (
    mood in ('少し憂鬱', '緊張している', '疲れている', '普通', '楽しみ')
  ),
  constraint morning_requests_voice_style_check check (
    preferred_voice_style in ('優しく', '明るく', '背中を押して', '面白く', '落ち着いて')
  ),
  constraint morning_requests_status_check check (
    status in ('draft', 'open', 'voice_assigned', 'completed')
  ),
  constraint morning_requests_voice_count_check check (voice_count >= 0)
);

create index if not exists morning_requests_open_created_at_idx
  on public.morning_requests (created_at desc)
  where status = 'open';

create index if not exists morning_requests_user_created_at_idx
  on public.morning_requests (user_id, created_at desc);

alter table public.morning_requests enable row level security;

revoke all on table public.morning_requests from anon, authenticated;
grant select, insert, update, delete on table public.morning_requests to authenticated;

drop policy if exists "Users can read open and own morning requests" on public.morning_requests;
create policy "Users can read open and own morning requests"
on public.morning_requests
for select
to authenticated
using (status = 'open' or (select auth.uid()) = user_id);

drop policy if exists "Users can create their own morning requests" on public.morning_requests;
create policy "Users can create their own morning requests"
on public.morning_requests
for insert
to authenticated
with check ((select auth.uid()) = user_id);

drop policy if exists "Users can update their own morning requests" on public.morning_requests;
create policy "Users can update their own morning requests"
on public.morning_requests
for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

drop policy if exists "Users can delete their own morning requests" on public.morning_requests;
create policy "Users can delete their own morning requests"
on public.morning_requests
for delete
to authenticated
using ((select auth.uid()) = user_id);
