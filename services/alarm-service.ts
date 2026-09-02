import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Crypto from 'expo-crypto';
import { Linking, Platform } from 'react-native';

import { getNextWakeDate } from '@/features/morning/get-next-wake-date';
import { logDevelopmentError } from '@/lib/development-logger';
import { WakeAlarm } from '@/modules/wake-alarm';
import type { MorningRequest } from '@/types';

const activeAlarmStorageKey = '@wake-hack/active-alarm';

export type AlarmDeliveryMode = 'native' | 'notification';

export type ActiveAlarm = {
  id: string;
  morningRequestId: string;
  scheduledFor: string;
  deliveryMode: AlarmDeliveryMode;
  sound: 'default' | 'personal';
  voiceMessageId?: string;
  soundFileName?: string;
};

export type AlarmSetupResult =
  | { status: 'scheduled'; alarm: ActiveAlarm }
  | { status: 'denied' | 'expired' | 'unavailable' | 'error' };

function getAlarmDate(request: MorningRequest): Date | null {
  if (request.scheduledFor) {
    const scheduledDate = new Date(request.scheduledFor);
    if (!Number.isNaN(scheduledDate.getTime())) {
      return scheduledDate.getTime() > Date.now() ? scheduledDate : null;
    }
  }
  return getNextWakeDate(request.wakeAt);
}

function parseActiveAlarm(value: string | null): ActiveAlarm | null {
  if (!value) return null;
  try {
    const parsed: unknown = JSON.parse(value);
    if (
      typeof parsed !== 'object' ||
      parsed === null ||
      !('id' in parsed) ||
      typeof parsed.id !== 'string' ||
      !('morningRequestId' in parsed) ||
      typeof parsed.morningRequestId !== 'string' ||
      !('scheduledFor' in parsed) ||
      typeof parsed.scheduledFor !== 'string' ||
      !('deliveryMode' in parsed) ||
      (parsed.deliveryMode !== 'native' && parsed.deliveryMode !== 'notification')
    ) {
      return null;
    }
    const alarm = parsed as Omit<ActiveAlarm, 'sound'> & {
      sound?: ActiveAlarm['sound'];
    };
    return {
      ...alarm,
      sound: alarm.sound === 'personal' ? 'personal' : 'default',
    };
  } catch (error) {
    logDevelopmentError('alarm.parseStored', error);
    return null;
  }
}

export class AlarmService {
  private readonly schedulePromises = new Map<
    string,
    Promise<AlarmSetupResult>
  >();

  isNativeAlarmAvailable(): boolean {
    return Platform.OS !== 'web' && WakeAlarm.isAvailable();
  }

  ensureScheduled(request: MorningRequest): Promise<AlarmSetupResult> {
    const key = `${request.id}:${request.scheduledFor ?? request.wakeAt}`;
    const existing = this.schedulePromises.get(key);
    if (existing) return existing;

    const schedule = this.performEnsureScheduled(request).finally(() => {
      if (this.schedulePromises.get(key) === schedule) {
        this.schedulePromises.delete(key);
      }
    });
    this.schedulePromises.set(key, schedule);
    return schedule;
  }

  private async performEnsureScheduled(
    request: MorningRequest
  ): Promise<AlarmSetupResult> {
    const expectedDate = getAlarmDate(request);
    if (!expectedDate) return { status: 'expired' };

    const active = await this.getActiveAlarm();
    if (
      active &&
      active.morningRequestId === request.id &&
      Math.abs(new Date(active.scheduledFor).getTime() - expectedDate.getTime()) < 1_000
    ) {
      return { status: 'scheduled', alarm: active };
    }
    return this.scheduleForRequest(request);
  }

  async scheduleForRequest(request: MorningRequest): Promise<AlarmSetupResult> {
    if (Platform.OS === 'web') return { status: 'unavailable' };

    const wakeDate = getAlarmDate(request);
    if (!wakeDate) return { status: 'expired' };

    try {
      await this.cancelScheduledAlarm();

      if (this.isNativeAlarmAvailable()) {
        let authorization = WakeAlarm.getAuthorizationStatus();
        if (authorization === 'notDetermined') {
          authorization = await WakeAlarm.requestAuthorization();
        }

        if (authorization === 'authorized') {
          try {
            const scheduled = await WakeAlarm.scheduleAlarm(
              Crypto.randomUUID(),
              wakeDate.getTime(),
              '朝の時間です'
            );
            const alarm: ActiveAlarm = {
              id: scheduled.id,
              morningRequestId: request.id,
              scheduledFor: new Date(scheduled.scheduledFor).toISOString(),
              deliveryMode: 'native',
              sound: 'default',
            };
            await AsyncStorage.setItem(activeAlarmStorageKey, JSON.stringify(alarm));
            return { status: 'scheduled', alarm };
          } catch (error) {
            logDevelopmentError('alarm.scheduleNativeFallback', error);
            return { status: 'error' };
          }
        }

        if (authorization === 'denied') {
          return { status: 'denied' };
        }
      }

      return { status: 'unavailable' };
    } catch (error) {
      logDevelopmentError('alarm.schedule', error);
      return { status: 'error' };
    }
  }

  async getActiveAlarm(): Promise<ActiveAlarm | null> {
    const alarm = parseActiveAlarm(await AsyncStorage.getItem(activeAlarmStorageKey));
    if (!alarm) return null;

    const scheduledForMs = new Date(alarm.scheduledFor).getTime();
    if (!Number.isFinite(scheduledForMs) || scheduledForMs <= Date.now()) {
      await AsyncStorage.removeItem(activeAlarmStorageKey);
      return null;
    }

    if (alarm.deliveryMode === 'native') {
      try {
        if (!WakeAlarm.getAlarmIds().includes(alarm.id)) {
          await AsyncStorage.removeItem(activeAlarmStorageKey);
          return null;
        }
      } catch (error) {
        logDevelopmentError('alarm.getActive', error);
      }
    }
    return alarm;
  }

  async replaceWithPersonalVoice(input: {
    morningRequestId: string;
    voiceMessageId: string;
    remoteUrl: string;
  }): Promise<ActiveAlarm | null> {
    if (Platform.OS !== 'ios' || !this.isNativeAlarmAvailable()) return null;

    const active = await this.getActiveAlarm();
    if (
      !active ||
      active.deliveryMode !== 'native' ||
      active.morningRequestId !== input.morningRequestId
    ) {
      return null;
    }
    if (active.sound === 'personal' && active.voiceMessageId === input.voiceMessageId) {
      return active;
    }

    const fireDateMs = new Date(active.scheduledFor).getTime();
    if (!Number.isFinite(fireDateMs) || fireDateMs <= Date.now() + 8_000) return null;

    try {
      const previousSoundFileName = active.soundFileName;
      const replacement = await WakeAlarm.replaceAlarmWithVoice(
        active.id,
        Crypto.randomUUID(),
        fireDateMs,
        '朝の声が届いています',
        input.remoteUrl,
        input.voiceMessageId
      );
      const alarm: ActiveAlarm = {
        id: replacement.id,
        morningRequestId: input.morningRequestId,
        scheduledFor: new Date(replacement.scheduledFor).toISOString(),
        deliveryMode: 'native',
        sound: 'personal',
        voiceMessageId: input.voiceMessageId,
        soundFileName: replacement.soundFileName,
      };
      await AsyncStorage.setItem(activeAlarmStorageKey, JSON.stringify(alarm));
      if (previousSoundFileName && previousSoundFileName !== replacement.soundFileName) {
        await WakeAlarm.removeSoundFile(previousSoundFileName).catch((error) => {
          logDevelopmentError('alarm.removePreviousVoice', error);
        });
      }
      return alarm;
    } catch (error) {
      // The default native alarm stays scheduled unless the replacement was
      // completely prepared, so a failed download never leaves the user silent.
      logDevelopmentError('alarm.replaceWithPersonalVoice', error);
      return null;
    }
  }

  async cancelScheduledAlarm(): Promise<void> {
    const stored = parseActiveAlarm(await AsyncStorage.getItem(activeAlarmStorageKey));
    try {
      if (stored?.deliveryMode === 'native') {
        await WakeAlarm.cancelAlarm(stored.id);
      }
      for (const id of WakeAlarm.getAlarmIds()) {
        if (id !== stored?.id) await WakeAlarm.cancelAlarm(id);
      }
    } catch (error) {
      logDevelopmentError('alarm.cancelNative', error);
    }
    if (stored?.soundFileName) {
      await WakeAlarm.removeSoundFile(stored.soundFileName).catch((error) => {
        logDevelopmentError('alarm.removeVoice', error);
      });
    }
    await AsyncStorage.removeItem(activeAlarmStorageKey);
  }

  async openSettings(): Promise<void> {
    try {
      await Linking.openSettings();
    } catch (error) {
      logDevelopmentError('alarm.openSettings', error);
    }
  }
}

export const alarmService = new AlarmService();
