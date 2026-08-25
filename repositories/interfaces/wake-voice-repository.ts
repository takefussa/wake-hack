import type { MorningRequest, VoiceMessage } from '@/types';

export interface WakeVoiceRepository {
  findPersonalForRequest(
    request: MorningRequest,
    receiverId: string
  ): Promise<VoiceMessage | null>;
  findCommunityForRequest(
    request: MorningRequest,
    receiverId: string
  ): Promise<VoiceMessage>;
}
