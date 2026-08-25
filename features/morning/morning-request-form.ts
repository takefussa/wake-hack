import type { ScheduleType } from '@/types';

export function toggleSchedule(
  selected: ScheduleType[],
  next: ScheduleType
): ScheduleType[] {
  if (next === '特にない') {
    return selected.includes(next) ? [] : [next];
  }

  const withoutNone = selected.filter((schedule) => schedule !== '特にない');
  return withoutNone.includes(next)
    ? withoutNone.filter((schedule) => schedule !== next)
    : [...withoutNone, next];
}
