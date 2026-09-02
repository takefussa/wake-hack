import type { AvatarId } from '@/types/user';

export type WakeStyle = 'gentle' | 'cheerful' | 'strict' | 'funny';

export type CommunityVoiceModerationStatus = 'pending' | 'approved' | 'rejected';

export type CommunityVoice = {
  id: string;
  senderId: string;
  senderNickname?: string;
  senderAvatarId?: AvatarId;
  audioPath: string;
  uri: string;
  durationMs: number;
  wakeStyle: WakeStyle;
  moderationStatus: CommunityVoiceModerationStatus;
  playCount: number;
  thanksCount: number;
  createdAt: string;
};

export type CommunityVoiceStats = {
  wakeCount: number;
  thanksCount: number;
};

export type CommunityVoiceDelivery = {
  id: string;
  voiceId: string;
  receiverId: string;
  deliveredAt: string;
  playedAt: string | null;
};

export type CreateCommunityVoiceInput = {
  senderId: string;
  uri: string;
  durationMs: number;
  wakeStyle: WakeStyle;
};
