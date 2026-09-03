-- Some previous builds created a second, moderation-oriented overload of
-- send_personal_voice with three extra text parameters. PostgREST cannot
-- resolve the six-argument call while both signatures exist (PGRST203).
-- Keep one canonical function signature used by the app.

drop function if exists public.send_personal_voice(
  uuid, uuid, uuid, uuid, text, integer, text, text, text
);
