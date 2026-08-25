import type { WakeVoiceRepository } from '@/repositories/interfaces/wake-voice-repository';
import { MockWakeVoiceRepository } from '@/repositories/mock/mock-wake-voice-repository';
import type { MorningRequest, VoiceMessage } from '@/types';

export type WakeVoiceAssignmentMode = 'personal' | 'community' | 'community_fallback';

export type WakeVoiceAssignment = {
  voice: VoiceMessage;
  mode: WakeVoiceAssignmentMode;
};

export class WakeService {
  constructor(private readonly repository: WakeVoiceRepository) {}

  async assignWakeVoice(
    request: MorningRequest,
    receiverId: string
  ): Promise<WakeVoiceAssignment> {
    if (request.personalEligible) {
      try {
        const personalVoice = await this.repository.findPersonalForRequest(
          request,
          receiverId
        );
        if (personalVoice?.type === 'personal') {
          return { voice: personalVoice, mode: 'personal' };
        }
      } catch {
        // A missing Personal Voice must not interrupt the morning experience.
      }
    }

    const communityVoice = await this.repository.findCommunityForRequest(
      request,
      receiverId
    );
    return {
      voice: communityVoice,
      mode: request.personalEligible ? 'community_fallback' : 'community',
    };
  }
}

export const wakeService = new WakeService(new MockWakeVoiceRepository());
