import type {
  CommunityVoice,
  CommunityVoiceStats,
  CreateCommunityVoiceInput,
  WakeStyle,
} from '@/types';

export interface CommunityVoiceRepository {
  create(input: CreateCommunityVoiceInput): Promise<CommunityVoice>;
  assignForWakeStyle(
    wakeStyle: WakeStyle,
    receiverId: string
  ): Promise<{ voice: CommunityVoice; deliveryId: string } | null>;
  markPlayed(deliveryId: string): Promise<void>;
  sendThanks(voiceId: string, userId: string): Promise<void>;
  hasThanks(voiceId: string, userId: string): Promise<boolean>;
  getStats(userId: string): Promise<CommunityVoiceStats>;
  listMine(userId: string): Promise<CommunityVoice[]>;
  deleteMine(voiceId: string, userId: string): Promise<void>;
}
