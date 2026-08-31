export type WakeSessionStatus = 'scheduled' | 'ringing' | 'completed';

export type WakeSession = {
  id: string;
  userId: string;
  morningRequestId: string;
  voiceMessageId: string;
  alarmAt: string;
  wokeAt?: string;
  status: WakeSessionStatus;
};
