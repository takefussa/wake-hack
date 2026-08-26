import type { DayOfWeek, WeeklyWakePlan } from '@/types';

const dayOfWeekByIndex: DayOfWeek[] = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];

export function createEmptyWeeklyWakePlan(): WeeklyWakePlan {
  return {
    sun: null,
    mon: null,
    tue: null,
    wed: null,
    thu: null,
    fri: null,
    sat: null,
  };
}

export function getDayOfWeekFromDate(date: Date): DayOfWeek {
  return dayOfWeekByIndex[date.getDay()];
}

export function getTomorrowDayOfWeek(): DayOfWeek {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return getDayOfWeekFromDate(tomorrow);
}
