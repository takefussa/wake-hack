import type { MorningRequest, VoiceMessage } from '@/types';

export interface WakeVoiceRepository {
  findPersonalById(
    voiceMessageId: string,
    request: MorningRequest,
    receiverId: string
  ): Promise<VoiceMessage | null>;
  findPersonalForRequest(
    request: MorningRequest,
    receiverId: string
  ): Promise<VoiceMessage | null>;
  findPersonalForAlarm(
    request: MorningRequest,
    receiverId: string
  ): Promise<VoiceMessage | null>;
  findCommunityForRequest(
    request: MorningRequest,
    receiverId: string
  ): Promise<VoiceMessage>;
}
