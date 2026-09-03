import { mockCommunityVoices, mockPersonalWakeVoice } from '@/data/mock-voices';
import { bindWakeVoice } from '@/features/wake/bind-wake-voice';
import type { WakeVoiceRepository } from '@/repositories/interfaces/wake-voice-repository';
import type { MorningRequest, VoiceMessage } from '@/types';

export class MockWakeVoiceRepository implements WakeVoiceRepository {
  async findPersonalById(
    voiceMessageId: string,
    request: MorningRequest,
    receiverId: string
  ): Promise<VoiceMessage | null> {
    if (!request.personalEligible || !voiceMessageId) return null;
    return bindWakeVoice(mockPersonalWakeVoice, request.id, receiverId);
  }

  async findPersonalForRequest(
    request: MorningRequest,
    receiverId: string
  ): Promise<VoiceMessage | null> {
    if (!request.personalEligible) return null;

    return bindWakeVoice(mockPersonalWakeVoice, request.id, receiverId);
  }

  findPersonalForAlarm(
    request: MorningRequest,
    receiverId: string
  ): Promise<VoiceMessage | null> {
    return this.findPersonalForRequest(request, receiverId);
  }

  async findCommunityForRequest(
    request: MorningRequest,
    receiverId: string
  ): Promise<VoiceMessage> {
    const communityVoice = mockCommunityVoices[0];
    return bindWakeVoice(communityVoice, request.id, receiverId);
  }
}
