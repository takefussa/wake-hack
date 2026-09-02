-- Keep the database constraint aligned with the custom "その他" schedule UI.

create or replace function public.are_valid_morning_schedules(
  p_schedules text[]
)
returns boolean
language sql
immutable
set search_path = ''
as $$
  select
    cardinality(p_schedules) > 0
    and not exists (
      select 1
      from unnest(p_schedules) as schedule(value)
      where schedule.value is null
      or (
        schedule.value not in (
          '1限', '授業', '試験', '発表', '面接', '仕事',
          '朝活', '旅行', '特にない'
        )
        and not (
          schedule.value like 'その他：%'
          and length(btrim(substring(schedule.value from length('その他：') + 1))) > 0
        )
      )
    )
    and (
      not ('特にない' = any(p_schedules))
      or cardinality(p_schedules) = 1
    );
$$;

alter table public.morning_requests
  drop constraint if exists morning_requests_schedules_check;

alter table public.morning_requests
  add constraint morning_requests_schedules_check
  check (public.are_valid_morning_schedules(schedules));
