import { mockCommunityVoices, mockPersonalWakeVoice } from '@/data/mock-voices';
import type { WakeVoiceRepository } from '@/repositories/interfaces/wake-voice-repository';
import type { MorningRequest, VoiceMessage } from '@/types';

export class MockWakeVoiceRepository implements WakeVoiceRepository {
  async findPersonalForRequest(
    request: MorningRequest,
    receiverId: string
  ): Promise<VoiceMessage | null> {
    if (!request.personalEligible) return null;

    return {
      ...mockPersonalWakeVoice,
      receiverId,
      morningRequestId: request.id,
    };
  }

  async findCommunityForRequest(
    request: MorningRequest,
    receiverId: string
  ): Promise<VoiceMessage> {
    const communityVoice = mockCommunityVoices[0];
    return {
      ...communityVoice,
      receiverId,
      morningRequestId: request.id,
    };
  }
}
