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
  wakeStyle?: import('@/types/community-voice').WakeStyle;
  transcript?: string;
  createdAt: string;
};

export type CreatePersonalVoiceInput = {
  senderId: string;
  receiverId: string;
  morningRequestId: string;
  senderMorningRequestId: string;
  uri: string;
  durationMs: number;
};
