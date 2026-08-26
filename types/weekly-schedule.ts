import type { ScheduleType } from './morning';

export type DayOfWeek = 'sun' | 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat';

export type WeeklyWakePlanEntry = {
  wakeAt: string;
  schedules: ScheduleType[];
};

export type WeeklyWakePlan = Record<DayOfWeek, WeeklyWakePlanEntry | null>;
