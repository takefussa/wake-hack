-- Shared Community Voice storage. Personal Voice remains private in
-- voice_messages; Community Voice is public to authenticated Wake users and
-- selected at alarm preparation time.

create table if not exists public.community_voices (
  id uuid primary key,
  sender_id uuid not null references public.profiles (id) on delete cascade,
  storage_path text not null unique,
  duration_ms integer not null,
  voice_style text not null,
  created_at timestamptz not null default now(),
  constraint community_voices_duration_check check (duration_ms between 2000 and 10000),
  constraint community_voices_style_check check (length(btrim(voice_style)) > 0)
);

create index if not exists community_voices_style_created_at_idx
  on public.community_voices (voice_style, created_at desc);

create index if not exists community_voices_created_at_idx
  on public.community_voices (created_at desc);

alter table public.community_voices enable row level security;

revoke all on table public.community_voices from anon, authenticated;
grant select, insert on table public.community_voices to authenticated;

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

-- Existing projects may already have the private voice bucket. Add WAV for
-- AlarmKit-compatible PCM recordings without weakening its size limit.
update storage.buckets
set allowed_mime_types = array['audio/mp4', 'audio/m4a', 'audio/x-m4a', 'audio/wav', 'audio/x-wav']
where id = 'voice-messages';

drop policy if exists "Community voice senders can upload their own files" on storage.objects;
create policy "Community voice senders can upload their own files"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'voice-messages'
  and (storage.foldername(name))[1] = 'community'
  and (storage.foldername(name))[2] = (select auth.uid())::text
);

drop policy if exists "Authenticated users can read community voice files" on storage.objects;
create policy "Authenticated users can read community voice files"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'voice-messages'
  and (storage.foldername(name))[1] = 'community'
);

drop policy if exists "Community voice senders can remove their own files" on storage.objects;
create policy "Community voice senders can remove their own files"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'voice-messages'
  and (storage.foldername(name))[1] = 'community'
  and (storage.foldername(name))[2] = (select auth.uid())::text
);
