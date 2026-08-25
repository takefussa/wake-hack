import { logDevelopmentError } from '@/lib/development-logger';
import type { WakeVoiceRepository } from '@/repositories/interfaces/wake-voice-repository';
import { MockWakeVoiceRepository } from '@/repositories/mock/mock-wake-voice-repository';
import { SupabaseWakeVoiceRepository } from '@/repositories/supabase/supabase-wake-voice-repository';
import type { MorningRequest, VoiceMessage } from '@/types';

export type WakeVoiceAssignmentMode = 'personal' | 'community' | 'community_fallback';

export type WakeVoiceAssignment = {
  voice: VoiceMessage;
  mode: WakeVoiceAssignmentMode;
};

export class WakeService {
  constructor(
    private readonly repository: WakeVoiceRepository,
    private readonly demoRepository: WakeVoiceRepository
  ) {}

  async assignWakeVoice(
    request: MorningRequest,
    receiverId: string,
    givenVoiceMessages: VoiceMessage[] = []
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
      } catch (error) {
        logDevelopmentError('wake.findPersonal', error);
        // A missing Personal Voice must not interrupt the morning experience.
      }

      const hasMockGive = givenVoiceMessages.some(
        (voice) =>
          voice.type === 'personal' &&
          voice.senderId === receiverId &&
          !voice.storagePath
      );
      if (hasMockGive) {
        const demoVoice = await this.demoRepository.findPersonalForRequest(
          request,
          receiverId
        );
        if (demoVoice?.type === 'personal') {
          return { voice: demoVoice, mode: 'personal' };
        }
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

const mockWakeVoiceRepository = new MockWakeVoiceRepository();

export const wakeService = new WakeService(
  new SupabaseWakeVoiceRepository(mockWakeVoiceRepository),
  mockWakeVoiceRepository
);
