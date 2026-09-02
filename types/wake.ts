export type WakeSessionStatus = 'scheduled' | 'ringing' | 'completed';

export type WakeAssignmentType = 'personal' | 'community';

export type WakeAssignment = {
  id: string;
  morningRequestId: string;
  voiceMessageId?: string;
  communityVoiceId?: string;
  type: WakeAssignmentType;
  assignedAt: string;
};

export type WakeSession = {
  id: string;
  userId: string;
  morningRequestId: string;
  wakeAssignmentId?: string;
  voiceMessageId: string;
  alarmAt: string;
  scheduledFor?: string;
  wokeAt?: string;
  missionCompleted: boolean;
  isDemo?: boolean;
  status: WakeSessionStatus;
};
