-- Wake Hack Supabase Phase 4: Thanks for a received Personal Voice.

create table if not exists public.thanks_messages (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid not null references public.profiles (id) on delete cascade,
  receiver_id uuid not null references public.profiles (id) on delete cascade,
  source_voice_message_id uuid not null
    references public.voice_messages (id) on delete cascade,
  reaction text not null,
  text_message text,
  created_at timestamptz not null default now(),
  constraint thanks_messages_source_voice_unique unique (source_voice_message_id),
  constraint thanks_messages_participants_check check (sender_id <> receiver_id),
  constraint thanks_messages_reaction_check check (length(btrim(reaction)) > 0),
  constraint thanks_messages_text_check check (
    text_message is null or length(btrim(text_message)) > 0
  )
);

create index if not exists thanks_messages_receiver_created_at_idx
  on public.thanks_messages (receiver_id, created_at desc);

create index if not exists thanks_messages_sender_created_at_idx
  on public.thanks_messages (sender_id, created_at desc);

alter table public.thanks_messages enable row level security;

revoke all on table public.thanks_messages from anon, authenticated;
grant select, insert on table public.thanks_messages to authenticated;

drop policy if exists "Thanks participants can read messages" on public.thanks_messages;
create policy "Thanks participants can read messages"
on public.thanks_messages
for select
to authenticated
using (
  (select auth.uid()) = sender_id
  or (select auth.uid()) = receiver_id
);

drop policy if exists "Personal voice receivers can send thanks" on public.thanks_messages;
create policy "Personal voice receivers can send thanks"
on public.thanks_messages
for insert
to authenticated
with check (
  (select auth.uid()) = sender_id
  and exists (
    select 1
    from public.voice_messages as voice
    where voice.id = thanks_messages.source_voice_message_id
      and voice.type = 'personal'
      and voice.receiver_id = (select auth.uid())
      and voice.sender_id = thanks_messages.receiver_id
  )
);
