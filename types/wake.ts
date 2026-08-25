export type WakeSessionStatus = 'scheduled' | 'ringing' | 'mission' | 'completed';

export type WakeSession = {
  id: string;
  userId: string;
  morningRequestId: string;
  voiceMessageId: string;
  alarmAt: string;
  wokeAt?: string;
  missionCompleted: boolean;
  status: WakeSessionStatus;
};
