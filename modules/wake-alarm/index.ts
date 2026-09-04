import { requireOptionalNativeModule } from 'expo-modules-core';

export type WakeAlarmAuthorizationStatus =
  | 'notDetermined'
  | 'denied'
  | 'authorized'
  | 'unavailable'
  | 'unknown';

export type ScheduledWakeAlarm = {
  id: string;
  scheduledFor: number;
  soundFileName?: string;
};

export type StoppedWakeAlarm = {
  morningRequestId: string;
  stoppedAt: string;
};

type WakeAlarmNativeModule = {
  isAvailable(): boolean;
  getAuthorizationStatus(): WakeAlarmAuthorizationStatus;
  requestAuthorization(): Promise<WakeAlarmAuthorizationStatus>;
  scheduleAlarm(
    id: string,
    fireDateMs: number,
    title: string,
    morningRequestId: string
  ): Promise<ScheduledWakeAlarm>;
  rescheduleAlarmWithPreparedVoice(
    oldId: string,
    newId: string,
    fireDateMs: number,
    title: string,
    soundFileName: string,
    morningRequestId: string
  ): Promise<ScheduledWakeAlarm>;
  replaceAlarmWithVoice(
    oldId: string,
    newId: string,
    fireDateMs: number,
    title: string,
    remoteUrl: string,
    voiceId: string,
    morningRequestId: string
  ): Promise<ScheduledWakeAlarm>;
  cancelAlarm(id: string): Promise<void>;
  removeSoundFile(fileName: string): Promise<void>;
  getAlarmIds(): string[];
  consumeStoppedAlarm(): StoppedWakeAlarm | null;
  openSettings?(): Promise<void>;
  /** Android only: whether the OS still grants full-screen lock-screen alarms. */
  canUseFullScreenIntent?(): boolean;
  /** Android only: whether this app is excluded from battery optimization. */
  isIgnoringBatteryOptimizations?(): boolean;
  /** Android only: opens the OS battery-optimization exclusion settings list. */
  openBatteryOptimizationSettings?(): Promise<void>;
  /** Android only: whether POST_NOTIFICATIONS is granted (always true pre-API 33). */
  hasNotificationPermission?(): boolean;
  /** Android only: shows the OS POST_NOTIFICATIONS request dialog if undetermined. */
  requestNotificationPermission?(): Promise<boolean>;
  /** Android only: opens this app's notification settings screen. */
  openNotificationSettings?(): Promise<void>;
};

const nativeModule =
  requireOptionalNativeModule<WakeAlarmNativeModule>('WakeAlarm');

export const WakeAlarm = {
  isAvailable(): boolean {
    return nativeModule?.isAvailable() ?? false;
  },

  getAuthorizationStatus(): WakeAlarmAuthorizationStatus {
    return nativeModule?.getAuthorizationStatus() ?? 'unavailable';
  },

  async requestAuthorization(): Promise<WakeAlarmAuthorizationStatus> {
    return (await nativeModule?.requestAuthorization()) ?? 'unavailable';
  },

  async scheduleAlarm(
    id: string,
    fireDateMs: number,
    title: string,
    morningRequestId: string
  ): Promise<ScheduledWakeAlarm> {
    if (!nativeModule) {
      throw new Error('AlarmKit is unavailable on this device.');
    }
    return nativeModule.scheduleAlarm(id, fireDateMs, title, morningRequestId);
  },

  async replaceAlarmWithVoice(
    oldId: string,
    newId: string,
    fireDateMs: number,
    title: string,
    remoteUrl: string,
    voiceId: string,
    morningRequestId: string
  ): Promise<ScheduledWakeAlarm> {
    if (!nativeModule) {
      throw new Error('AlarmKit is unavailable on this device.');
    }
    return nativeModule.replaceAlarmWithVoice(
      oldId,
      newId,
      fireDateMs,
      title,
      remoteUrl,
      voiceId,
      morningRequestId
    );
  },

  async rescheduleAlarmWithPreparedVoice(
    oldId: string,
    newId: string,
    fireDateMs: number,
    title: string,
    soundFileName: string,
    morningRequestId: string
  ): Promise<ScheduledWakeAlarm> {
    if (!nativeModule) {
      throw new Error('AlarmKit is unavailable on this device.');
    }
    return nativeModule.rescheduleAlarmWithPreparedVoice(
      oldId,
      newId,
      fireDateMs,
      title,
      soundFileName,
      morningRequestId
    );
  },

  async cancelAlarm(id: string): Promise<void> {
    await nativeModule?.cancelAlarm(id);
  },

  async removeSoundFile(fileName: string): Promise<void> {
    await nativeModule?.removeSoundFile(fileName);
  },

  getAlarmIds(): string[] {
    return nativeModule?.getAlarmIds() ?? [];
  },

  consumeStoppedAlarm(): StoppedWakeAlarm | null {
    return nativeModule?.consumeStoppedAlarm() ?? null;
  },

  async openSettings(): Promise<void> {
    await nativeModule?.openSettings?.();
  },

  /** Android only. Returns true on platforms without this restriction (e.g. iOS). */
  canUseFullScreenIntent(): boolean {
    return nativeModule?.canUseFullScreenIntent?.() ?? true;
  },

  /** Android only. Returns true on platforms without this concept (e.g. iOS). */
  isIgnoringBatteryOptimizations(): boolean {
    return nativeModule?.isIgnoringBatteryOptimizations?.() ?? true;
  },

  async openBatteryOptimizationSettings(): Promise<void> {
    await nativeModule?.openBatteryOptimizationSettings?.();
  },

  /** Android only. Returns true on platforms without this concept (e.g. iOS). */
  hasNotificationPermission(): boolean {
    return nativeModule?.hasNotificationPermission?.() ?? true;
  },

  /** Android only. Resolves true immediately on platforms without this concept. */
  async requestNotificationPermission(): Promise<boolean> {
    return (await nativeModule?.requestNotificationPermission?.()) ?? true;
  },

  async openNotificationSettings(): Promise<void> {
    await nativeModule?.openNotificationSettings?.();
  },
};
