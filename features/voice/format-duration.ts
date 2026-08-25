export function formatRecordingDuration(durationMs: number): string {
  const clampedDuration = Math.max(0, durationMs);
  const seconds = Math.floor(clampedDuration / 1_000);
  const tenths = Math.floor((clampedDuration % 1_000) / 100);
  return `00:${String(seconds).padStart(2, '0')}.${tenths}`;
}
