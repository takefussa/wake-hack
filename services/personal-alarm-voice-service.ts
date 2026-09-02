import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

import { logDevelopmentError } from '@/lib/development-logger';
import { alarmService, type ActiveAlarm } from '@/services/alarm-service';
import { voiceService } from '@/services/voice-service';
import { wakeService } from '@/services/wake-service';
import type { MorningRequest, VoiceMessage } from '@/types';

export type PersonalAlarmVoiceSyncResult =
  | {
      status: 'ready';
      alarm: ActiveAlarm;
      source: 'personal' | 'community';
      personalVoice?: VoiceMessage;
    }
  | { status: 'waiting' | 'unavailable' | 'failed' };

const diagnosticStorageKey = '@wake-hack/personal-alarm-diagnostic';

type PersonalAlarmDiagnostic = {
  checkedAt: string;
  morningRequestId: string;
  status: 'checking' | 'no-voice' | 'voice-found' | 'ready' | 'failed';
  voiceMessageId?: string;
  soundFileName?: string;
  error?: string;
};

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === 'object' && error !== null && 'message' in error) {
    const message = (error as { message?: unknown }).message;
    if (typeof message === 'string') return message;
  }
  return String(error);
}

async function saveDiagnostic(
  request: MorningRequest,
  values: Omit<PersonalAlarmDiagnostic, 'checkedAt' | 'morningRequestId'>
): Promise<void> {
  try {
    await AsyncStorage.setItem(
      diagnosticStorageKey,
      JSON.stringify({
        checkedAt: new Date().toISOString(),
        morningRequestId: request.id,
        ...values,
      } satisfies PersonalAlarmDiagnostic)
    );
  } catch (error) {
    logDevelopmentError('personalAlarmVoice.diagnostic', error);
  }
}

export class PersonalAlarmVoiceService {
  private readonly syncPromises = new Map<
    string,
    Promise<PersonalAlarmVoiceSyncResult>
  >();

  async syncForRequest(
    request: MorningRequest,
    receiverId: string,
    voiceMessageId?: string
  ): Promise<PersonalAlarmVoiceSyncResult> {
    const key = `${request.id}:${voiceMessageId ?? 'latest'}`;
    const existing = this.syncPromises.get(key);
    if (existing) return existing;

    const sync = this.performSync(request, receiverId, voiceMessageId).finally(
      () => {
        if (this.syncPromises.get(key) === sync) {
          this.syncPromises.delete(key);
        }
      }
    );
    this.syncPromises.set(key, sync);
    return sync;
  }

  private async performSync(
    request: MorningRequest,
    receiverId: string,
    voiceMessageId?: string
  ): Promise<PersonalAlarmVoiceSyncResult> {
    if (Platform.OS !== 'ios' || !alarmService.isNativeAlarmAvailable()) {
      return { status: 'unavailable' };
    }
    if (request.userId !== receiverId) return { status: 'failed' };

    try {
      await saveDiagnostic(request, { status: 'checking' });
      let preparation;
      try {
        preparation = await wakeService.preparePersonalAlarmVoice(
          request,
          receiverId,
          voiceMessageId
        );
      } catch (error) {
        // The bundled Community Voice is available offline. If the Personal
        // Voice lookup fails, use it instead of weakening the alarm to silence.
        logDevelopmentError('personalAlarmVoice.lookup', error);
        preparation = { status: 'waiting' } as const;
      }
      if (preparation.status !== 'ready') {
        await saveDiagnostic(request, { status: 'no-voice' });
        const community = await wakeService.prepareCommunityAlarmVoice(
          request,
          receiverId
        );
        const alarm = await alarmService.replaceWithCommunityVoice({
          morningRequestId: request.id,
          voiceMessageId: community.voice.id,
          remoteUrl: community.voice.uri,
        });
        if (!alarm) return { status: 'failed' };
        return { status: 'ready', alarm, source: 'community' };
      }

      await saveDiagnostic(request, {
        status: 'voice-found',
        voiceMessageId: preparation.voice.id,
      });

      const alarm = await alarmService.replaceWithPersonalVoice({
        morningRequestId: request.id,
        voiceMessageId: preparation.voice.id,
        remoteUrl: preparation.voice.uri,
        senderId: preparation.voice.senderId,
      });
      if (!alarm) {
        await saveDiagnostic(request, {
          status: 'failed',
          voiceMessageId: preparation.voice.id,
          error: 'AlarmKit did not return a replacement alarm',
        });
        return { status: 'failed' };
      }
      await saveDiagnostic(request, {
        status: 'ready',
        voiceMessageId: preparation.voice.id,
        soundFileName: alarm.soundFileName,
      });
      try {
        await voiceService.acknowledgeAlarmReceived(
          preparation.voice.id,
          request.id
        );
      } catch (error) {
        // AlarmKit is already ready. A receipt failure must never downgrade
        // the working human-voice alarm or restore a standard alarm.
        logDevelopmentError('personalAlarmVoice.acknowledge', error);
      }
      return {
        status: 'ready',
        alarm,
        source: 'personal',
        personalVoice: preparation.voice,
      };
    } catch (error) {
      logDevelopmentError('personalAlarmVoice.sync', error);
      await saveDiagnostic(request, {
        status: 'failed',
        error: getErrorMessage(error),
      });
      return { status: 'failed' };
    }
  }
}

export const personalAlarmVoiceService = new PersonalAlarmVoiceService();
