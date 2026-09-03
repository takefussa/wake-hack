-- Optional free-form note describing the kind of wake-up message requested.

alter table public.morning_requests
  add column if not exists voice_request_note text;

alter table public.morning_requests
  drop constraint if exists morning_requests_voice_request_note_length_check;

alter table public.morning_requests
  add constraint morning_requests_voice_request_note_length_check
  check (voice_request_note is null or char_length(voice_request_note) <= 80);
