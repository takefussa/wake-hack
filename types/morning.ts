export type ScheduleType =
  | '1限'
  | '授業'
  | '試験'
  | '発表'
  | '面接'
  | '仕事'
  | '朝活'
  | '旅行'
  | 'その他'
  | `その他：${string}`
  | '特にない';

export type MoodType = '少し憂鬱' | '緊張している' | '疲れている' | '普通' | '楽しみ';

export type VoiceStyle = 'そっと優しく' | '明るく元気に' | '渇を入れて' | '面白く愉快に';

export type MorningRequestStatus = 'draft' | 'open' | 'voice_assigned' | 'completed';

export type MorningRequest = {
  id: string;
  userId: string;
  wakeAt: string;
  scheduledFor?: string;
  schedules: ScheduleType[];
  mood: MoodType;
  preferredVoiceStyle: VoiceStyle;
  personalEligible: boolean;
  status: MorningRequestStatus;
  voiceCount: number;
  createdAt: string;
};

export type MorningRequestDraft = {
  wakeAt: string;
};

export type CreateMorningRequestInput = Pick<
  MorningRequest,
  'wakeAt' | 'schedules' | 'mood' | 'preferredVoiceStyle'
>;
