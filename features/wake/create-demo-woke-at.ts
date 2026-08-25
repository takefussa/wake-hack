export function createDemoWokeAt(alarmAt: string): string {
  const [hours, minutes] = alarmAt.split(':').map(Number);
  const wokeAt = new Date();

  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) {
    return wokeAt.toISOString();
  }

  wokeAt.setHours(hours, minutes, 0, 0);
  return wokeAt.toISOString();
}
