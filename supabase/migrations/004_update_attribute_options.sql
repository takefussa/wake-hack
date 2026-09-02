-- Okita! Supabase Phase 4: update profile/morning-request attribute options.
-- Run this file in the Supabase SQL Editor after 001-003.
--
-- The UI now uses:
--   profiles.user_type            -> '中高生' | '大学生・専門学生' | '社会人' | 'その他'
--   morning_requests.preferred_voice_style -> 'そっと優しく' | '明るく元気に' | '渇を入れて' | '面白く愉快に'
-- Existing rows are not rewritten; the app should re-save affected profiles
-- and morning requests so they satisfy the new constraints.

alter table public.profiles
  drop constraint if exists profiles_user_type_check;

alter table public.profiles
  add constraint profiles_user_type_check
  check (user_type in ('中高生', '大学生・専門学生', '社会人', 'その他'))
  not valid;

alter table public.morning_requests
  drop constraint if exists morning_requests_voice_style_check;

alter table public.morning_requests
  add constraint morning_requests_voice_style_check
  check (preferred_voice_style in ('そっと優しく', '明るく元気に', '渇を入れて', '面白く愉快に'))
  not valid;
