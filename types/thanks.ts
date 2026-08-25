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
