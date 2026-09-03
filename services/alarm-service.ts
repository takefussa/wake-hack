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
  sound: 'default' | 'personal' | 'community';
  voiceMessageId?: string;
  voiceSenderId?: string;
  soundFileName?: string;
  /** Bump this whenever the native AlarmKit interaction configuration changes. */
  stopFlowVersion?: number;
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
      sound:
        alarm.sound === 'personal' || alarm.sound === 'community'
          ? alarm.sound
          : 'default',
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
      active.stopFlowVersion === 2 &&
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
      if (this.isNativeAlarmAvailable()) {
        let authorization = WakeAlarm.getAuthorizationStatus();
        if (authorization === 'notDetermined') {
          authorization = await WakeAlarm.requestAuthorization();
        }

        if (authorization === 'authorized') {
          const active = await this.getActiveAlarm();
          if (
            active?.deliveryMode === 'native' &&
            active.sound !== 'default' &&
            active.morningRequestId === request.id &&
            active.voiceMessageId &&
            active.soundFileName
          ) {
            try {
              const rescheduled =
                await WakeAlarm.rescheduleAlarmWithPreparedVoice(
                  active.id,
                  Crypto.randomUUID(),
                  wakeDate.getTime(),
                  '朝の声が届いています',
                  active.soundFileName,
                  request.id
                );
              const alarm: ActiveAlarm = {
                ...active,
                id: rescheduled.id,
                scheduledFor: new Date(rescheduled.scheduledFor).toISOString(),
                stopFlowVersion: 2,
              };
              await AsyncStorage.setItem(
                activeAlarmStorageKey,
                JSON.stringify(alarm)
              );
              return { status: 'scheduled', alarm };
            } catch (error) {
              // If the prepared file cannot be reused, the default alarm is
              // still scheduled below and foreground sync can download the
              // exact request voice again.
              logDevelopmentError('alarm.rescheduleWakeVoice', error);
            }
          }

          await this.cancelScheduledAlarm();
          try {
            const scheduled = await WakeAlarm.scheduleAlarm(
              Crypto.randomUUID(),
              wakeDate.getTime(),
              '朝の時間です',
              request.id
            );
            const alarm: ActiveAlarm = {
              id: scheduled.id,
              morningRequestId: request.id,
              scheduledFor: new Date(scheduled.scheduledFor).toISOString(),
              deliveryMode: 'native',
              sound: 'default',
              stopFlowVersion: 2,
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
      try {
        if (alarm.deliveryMode === 'native') {
          await WakeAlarm.cancelAlarm(alarm.id);
        }
      } catch (error) {
        logDevelopmentError('alarm.consumeExpired', error);
      }
      if (alarm.soundFileName) {
        await WakeAlarm.removeSoundFile(alarm.soundFileName).catch((error) => {
          logDevelopmentError('alarm.consumeExpiredVoice', error);
        });
      }
      await AsyncStorage.removeItem(activeAlarmStorageKey);
      return null;
    }

    if (alarm.deliveryMode === 'native') {
      try {
        if (!WakeAlarm.getAlarmIds().includes(alarm.id)) {
          if (alarm.soundFileName) {
            await WakeAlarm.removeSoundFile(alarm.soundFileName).catch((error) => {
              logDevelopmentError('alarm.consumeMissingVoice', error);
            });
          }
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
    senderId: string;
  }): Promise<ActiveAlarm | null> {
    return this.replaceWithWakeVoice({ ...input, sound: 'personal' });
  }

  async replaceWithCommunityVoice(input: {
    morningRequestId: string;
    voiceMessageId: string;
    remoteUrl: string;
  }): Promise<ActiveAlarm | null> {
    return this.replaceWithWakeVoice({
      ...input,
      senderId: 'community',
      sound: 'community',
    });
  }

  private async replaceWithWakeVoice(input: {
    morningRequestId: string;
    voiceMessageId: string;
    remoteUrl: string;
    senderId: string;
    sound: 'personal' | 'community';
  }): Promise<ActiveAlarm | null> {
    if (!this.isNativeAlarmAvailable()) {
      throw new Error('Native AlarmKit is unavailable');
    }

    const active = await this.getActiveAlarm();
    if (
      !active ||
      active.deliveryMode !== 'native' ||
      active.morningRequestId !== input.morningRequestId
    ) {
      throw new Error('No matching native alarm is scheduled');
    }
    if (active.sound === input.sound && active.voiceMessageId === input.voiceMessageId) {
      return active;
    }

    const fireDateMs = new Date(active.scheduledFor).getTime();
    if (!Number.isFinite(fireDateMs) || fireDateMs <= Date.now() + 8_000) {
      throw new Error('Not enough time remains to install the Wake Voice');
    }

    try {
      const previousSoundFileName = active.soundFileName;
      const replacement = await WakeAlarm.replaceAlarmWithVoice(
        active.id,
        Crypto.randomUUID(),
        fireDateMs,
        input.sound === 'personal'
          ? '朝の声が届いています'
          : 'Community Voiceで朝を始めます',
        input.remoteUrl,
        input.voiceMessageId,
        input.morningRequestId
      );
      const alarm: ActiveAlarm = {
        id: replacement.id,
        morningRequestId: input.morningRequestId,
        scheduledFor: new Date(replacement.scheduledFor).toISOString(),
        deliveryMode: 'native',
        sound: input.sound,
        voiceMessageId: input.voiceMessageId,
        voiceSenderId: input.senderId,
        soundFileName: replacement.soundFileName,
        stopFlowVersion: 2,
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
      logDevelopmentError('alarm.replaceWithWakeVoice', error);
      throw error;
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

  async consumeStoppedAlarm(): Promise<ActiveAlarm | null> {
    const stopped = WakeAlarm.consumeStoppedAlarm();
    if (!stopped) return null;

    const stored = parseActiveAlarm(
      await AsyncStorage.getItem(activeAlarmStorageKey)
    );
    if (!stored || stored.morningRequestId !== stopped.morningRequestId) {
      return null;
    }
    await AsyncStorage.removeItem(activeAlarmStorageKey);
    if (stored.soundFileName) {
      await WakeAlarm.removeSoundFile(stored.soundFileName).catch((error) => {
        logDevelopmentError('alarm.consumeStoppedVoice', error);
      });
    }
    return stored;
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
