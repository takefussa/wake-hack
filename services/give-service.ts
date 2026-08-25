import { morningRequestService } from '@/services/morning-request-service';
import { voiceService } from '@/services/voice-service';
import type { CreatePersonalVoiceInput, VoiceMessage } from '@/types';

export class GiveService {
  async sendPersonalVoice(input: CreatePersonalVoiceInput): Promise<VoiceMessage> {
    const voiceMessage = await voiceService.createPersonalVoice(input);
    await morningRequestService.markVoiceDelivered(input.morningRequestId);
    return voiceMessage;
  }
}

export const giveService = new GiveService();
