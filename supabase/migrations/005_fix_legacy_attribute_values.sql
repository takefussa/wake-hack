-- Okita! Supabase Phase 5: rewrite existing rows that still hold the old
-- attribute option values, so the sample/test data matches the frontend.
--
-- Run this file in the Supabase SQL Editor after 004. It depends on 004
-- having already relaxed the CHECK constraints to the new option sets;
-- running this before 004 will fail against the old constraints.

-- profiles.user_type: 大学生 / 受験生 / 社会人1年目 -> 中高生 / 大学生・専門学生 / 社会人
update public.profiles
set user_type = case user_type
  when '大学生' then '大学生・専門学生'
  when '受験生' then '中高生'
  when '社会人1年目' then '社会人'
  else user_type
end
where user_type not in ('中高生', '大学生・専門学生', '社会人', 'その他');

-- profiles.tags (生活リズム): drop any values outside the new single-select
-- set. There is no reliable mapping from the old free-form tags
-- (一人暮らし / 朝が苦手 / 朝活したい) to a specific life rhythm, so those
-- are removed rather than guessed; 夜型 is already valid and is kept.
update public.profiles
set tags = array(
  select t from unnest(tags) as t
  where t in ('朝型', '夜型', '不規則')
)
where not (tags <@ array['朝型', '夜型', '不規則']::text[]);

-- morning_requests.preferred_voice_style: old wording -> new wording
update public.morning_requests
set preferred_voice_style = case preferred_voice_style
  when '優しく' then 'そっと優しく'
  when '明るく' then '明るく元気に'
  when '背中を押して' then '渇を入れて'
  when '面白く' then '面白く愉快に'
  when '落ち着いて' then 'そっと優しく'
  else preferred_voice_style
end
where preferred_voice_style not in ('そっと優しく', '明るく元気に', '渇を入れて', '面白く愉快に');
