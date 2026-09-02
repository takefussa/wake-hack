export type VoiceMessageType = 'personal' | 'community' | 'thanks';

export type VoiceMessage = {
  id: string;
  senderId: string;
  receiverId?: string;
  morningRequestId?: string;
  uri: string;
  storagePath?: string;
  durationMs: number;
  type: VoiceMessageType;
  transcript?: string;
  createdAt: string;
  alarmReceivedAt?: string;
};

export type CreatePersonalVoiceInput = {
  senderId: string;
  receiverId: string;
  morningRequestId: string;
  senderMorningRequestId: string;
  uri: string;
  durationMs: number;
};
