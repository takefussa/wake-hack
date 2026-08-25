import type { CreatePersonalVoiceInput, VoiceMessage } from '@/types';

export interface VoiceRepository {
  createPersonal(input: CreatePersonalVoiceInput): Promise<VoiceMessage>;
}
