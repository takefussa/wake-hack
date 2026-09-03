-- Wake Hack Supabase Phase 8: allow the voice safety Edge Function to update moderation.

grant select, update on table public.community_voices to service_role;
