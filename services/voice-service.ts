import { prototypeConfig } from '@/constants/config';
import { logDevelopmentError } from '@/lib/development-logger';
import type { VoiceRepository } from '@/repositories/interfaces/voice-repository';
import { MockVoiceRepository } from '@/repositories/mock/mock-voice-repository';
import { SupabaseVoiceRepository } from '@/repositories/supabase/supabase-voice-repository';
import { morningRequestService } from '@/services/morning-request-service';
import type { CreatePersonalVoiceInput, VoiceMessage } from '@/types';

export class VoiceService {
  constructor(
    private readonly repository: VoiceRepository,
    private readonly mockRepository: VoiceRepository
  ) {}

  async createPersonalVoice(input: CreatePersonalVoiceInput): Promise<VoiceMessage> {
    if (!input.uri.trim()) {
      throw new Error('Recording URI is required');
    }
    if (
      input.durationMs < prototypeConfig.recordingMinMs ||
      input.durationMs > prototypeConfig.recordingMaxMs
    ) {
      throw new Error('Recording duration is outside the allowed range');
    }

    try {
      const isMockRequest = await morningRequestService.isMockRequest(
        input.morningRequestId
      );
      return isMockRequest
        ? this.mockRepository.createPersonal(input)
        : this.repository.createPersonal(input);
    } catch (error) {
      logDevelopmentError('voice.createPersonal', error);
      throw error;
    }
  }

  async getAlarmReceivedAt(voiceMessageId: string): Promise<string | null> {
    return this.repository.getAlarmReceivedAt(voiceMessageId);
  }

  async acknowledgeAlarmReceived(
    voiceMessageId: string,
    morningRequestId: string
  ): Promise<string> {
    return this.repository.acknowledgeAlarmReceived(
      voiceMessageId,
      morningRequestId
    );
  }
}

export const voiceService = new VoiceService(
  new SupabaseVoiceRepository(),
  new MockVoiceRepository()
);
