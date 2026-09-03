export function getNextWakeDate(wakeAt: string, now = new Date()): Date {
  const [hoursText, minutesText] = wakeAt.split(':');
  const hours = Number(hoursText);
  const minutes = Number(minutesText);

  if (
    !Number.isInteger(hours) ||
    !Number.isInteger(minutes) ||
    hours < 0 ||
    hours > 23 ||
    minutes < 0 ||
    minutes > 59
  ) {
    throw new Error(`Invalid wake time: ${wakeAt}`);
  }

  const wakeDate = new Date(now);
  wakeDate.setHours(hours, minutes, 0, 0);
  if (wakeDate.getTime() <= now.getTime()) {
    wakeDate.setDate(wakeDate.getDate() + 1);
  }
  return wakeDate;
}
