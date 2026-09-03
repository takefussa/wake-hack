export type ModerationStatus = 'pending' | 'approved' | 'rejected';

export type VoiceSafetyCategory =
  | 'safe'
  | 'insult'
  | 'hate'
  | 'sexual'
  | 'threat'
  | 'harassment'
  | 'irrelevant'
  | 'other';

export type VoiceCheckResult = {
  safe: boolean;
  category: VoiceSafetyCategory;
  reason: string;
};

export type VoiceCheckInput = {
  bucket: 'voice-messages' | 'community-voices';
  path: string;
  voiceKind: 'personal' | 'community';
  durationMs: number;
  voiceId?: string;
};
