export type VoiceMessageType = 'personal' | 'community' | 'thanks';

export type VoiceMessage = {
  id: string;
  sourceVoiceId?: string;
  senderId: string;
  receiverId?: string;
  morningRequestId?: string;
  deliveryId?: string;
  uri: string;
  storagePath?: string;
  durationMs: number;
  type: VoiceMessageType;
  moderationStatus?: import('@/types/voice-safety').ModerationStatus;
  moderationCategory?: import('@/types/voice-safety').VoiceSafetyCategory | null;
  moderationReason?: string | null;
  moderatedAt?: string | null;
  wakeStyle?: import('@/types/community-voice').WakeStyle;
  transcript?: string;
  createdAt: string;
  alarmReceivedAt?: string;
  voiceStyle?: VoiceStyle;
};

export type CreatePersonalVoiceInput = {
  senderId: string;
  receiverId: string;
  morningRequestId: string;
  senderMorningRequestId: string;
  uri: string;
  durationMs: number;
};
import type { VoiceStyle } from './morning';
