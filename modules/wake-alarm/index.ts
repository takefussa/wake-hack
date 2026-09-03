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
};
