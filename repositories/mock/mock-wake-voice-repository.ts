import { mockCommunityVoices, mockPersonalWakeVoice } from '@/data/mock-voices';
import { bindWakeVoice } from '@/features/wake/bind-wake-voice';
import type { WakeVoiceRepository } from '@/repositories/interfaces/wake-voice-repository';
import type { MorningRequest, VoiceMessage } from '@/types';

export class MockWakeVoiceRepository implements WakeVoiceRepository {
  async findPersonalForRequest(
    request: MorningRequest,
    receiverId: string
  ): Promise<VoiceMessage | null> {
    if (!request.personalEligible) return null;

    return bindWakeVoice(mockPersonalWakeVoice, request.id, receiverId);
  }

  async findCommunityForRequest(
    request: MorningRequest,
    receiverId: string
  ): Promise<VoiceMessage> {
    const communityVoice = mockCommunityVoices[0];
    return bindWakeVoice(communityVoice, request.id, receiverId);
  }
}
