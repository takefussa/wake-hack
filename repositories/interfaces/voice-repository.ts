import type { CreatePersonalVoiceInput, VoiceMessage } from '@/types';

export interface VoiceRepository {
  createPersonal(input: CreatePersonalVoiceInput): Promise<VoiceMessage>;
  getAlarmReceivedAt(voiceMessageId: string): Promise<string | null>;
  acknowledgeAlarmReceived(
    voiceMessageId: string,
    morningRequestId: string
  ): Promise<string>;
}
