do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'voice_messages'
  ) then
    alter publication supabase_realtime add table public.voice_messages;
  end if;
end
$$;
