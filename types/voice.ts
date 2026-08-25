export type VoiceMessageType = 'personal' | 'community' | 'thanks';

export type VoiceMessage = {
  id: string;
  senderId: string;
  receiverId?: string;
  morningRequestId?: string;
  uri: string;
  durationMs: number;
  type: VoiceMessageType;
  transcript?: string;
  createdAt: string;
};
