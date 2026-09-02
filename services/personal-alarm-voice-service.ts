import { Platform } from 'react-native';

import { logDevelopmentError } from '@/lib/development-logger';
import { alarmService, type ActiveAlarm } from '@/services/alarm-service';
import { wakeService } from '@/services/wake-service';
import type { MorningRequest } from '@/types';

export type PersonalAlarmVoiceSyncResult =
  | { status: 'ready'; alarm: ActiveAlarm }
  | { status: 'waiting' | 'unavailable' | 'failed' };

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
      const preparation = await wakeService.preparePersonalAlarmVoice(
        request,
        receiverId,
        voiceMessageId
      );
      if (preparation.status !== 'ready') return { status: 'waiting' };

      const alarm = await alarmService.replaceWithPersonalVoice({
        morningRequestId: request.id,
        voiceMessageId: preparation.voice.id,
        remoteUrl: preparation.voice.uri,
      });
      return alarm ? { status: 'ready', alarm } : { status: 'failed' };
    } catch (error) {
      logDevelopmentError('personalAlarmVoice.sync', error);
      return { status: 'failed' };
    }
  }
}

export const personalAlarmVoiceService = new PersonalAlarmVoiceService();
