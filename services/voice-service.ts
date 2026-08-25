import { prototypeConfig } from '@/constants/config';
import type { VoiceRepository } from '@/repositories/interfaces/voice-repository';
import { MockVoiceRepository } from '@/repositories/mock/mock-voice-repository';
import type { CreatePersonalVoiceInput, VoiceMessage } from '@/types';

export class VoiceService {
  constructor(private readonly repository: VoiceRepository) {}

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

    return this.repository.createPersonal(input);
  }
}

export const voiceService = new VoiceService(new MockVoiceRepository());
