import type { UserProfile } from './user';

export type ThanksMessageType = 'reaction' | 'text' | 'voice';

export type ThanksMessage = {
  id: string;
  senderId: string;
  receiverId: string;
  sourceVoiceMessageId: string;
  type: ThanksMessageType;
  content?: string;
  audioUri?: string;
  createdAt: string;
};

export type CreateThanksMessageInput = Omit<ThanksMessage, 'id' | 'createdAt'>;

export type SendThanksInput = {
  senderId: string;
  receiverId: string;
  sourceVoiceMessageId: string;
  reaction: string;
  text?: string;
};

export type ThanksInboxItem = {
  message: ThanksMessage;
  sender: UserProfile | null;
  contextLabel: string;
};
