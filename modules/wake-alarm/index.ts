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

type WakeAlarmNativeModule = {
  isAvailable(): boolean;
  getAuthorizationStatus(): WakeAlarmAuthorizationStatus;
  requestAuthorization(): Promise<WakeAlarmAuthorizationStatus>;
  scheduleAlarm(
    id: string,
    fireDateMs: number,
    title: string
  ): Promise<ScheduledWakeAlarm>;
  replaceAlarmWithVoice(
    oldId: string,
    newId: string,
    fireDateMs: number,
    title: string,
    remoteUrl: string,
    voiceId: string
  ): Promise<ScheduledWakeAlarm>;
  cancelAlarm(id: string): Promise<void>;
  removeSoundFile(fileName: string): Promise<void>;
  getAlarmIds(): string[];
  openSettings?(): Promise<void>;
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
    title: string
  ): Promise<ScheduledWakeAlarm> {
    if (!nativeModule) {
      throw new Error('AlarmKit is unavailable on this device.');
    }
    return nativeModule.scheduleAlarm(id, fireDateMs, title);
  },

  async replaceAlarmWithVoice(
    oldId: string,
    newId: string,
    fireDateMs: number,
    title: string,
    remoteUrl: string,
    voiceId: string
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
      voiceId
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

  async openSettings(): Promise<void> {
    await nativeModule?.openSettings?.();
  },
};
