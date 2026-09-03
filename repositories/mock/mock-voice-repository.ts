import type { VoiceRepository } from '@/repositories/interfaces/voice-repository';
import type { CreatePersonalVoiceInput, VoiceMessage } from '@/types';

export class MockVoiceRepository implements VoiceRepository {
  async createPersonal(input: CreatePersonalVoiceInput): Promise<VoiceMessage> {
    return {
      id: `personal-voice-${Date.now()}-${input.receiverId}`,
      senderId: input.senderId,
      receiverId: input.receiverId,
      morningRequestId: input.morningRequestId,
      uri: input.uri,
      durationMs: input.durationMs,
      type: 'personal',
      createdAt: new Date().toISOString(),
    };
  }

  async getAlarmReceivedAt(): Promise<string | null> {
    return null;
  }

  async acknowledgeAlarmReceived(): Promise<string> {
    return new Date().toISOString();
  }
}
