const mockWakeTimesByUserId: Readonly<Record<string, string>> = {
  'user-takuma': '07:03',
  'user-takumi': '07:36',
  'user-mio': '06:52',
  'user-haruka': '07:28',
  'user-sota': '06:24',
  'user-noa': '07:51',
  'user-ren': '06:48',
  'user-aoi': '07:12',
};

export function getMockWakeTime(userId: string): string | null {
  return mockWakeTimesByUserId[userId] ?? null;
}
