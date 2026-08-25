export type ScheduleType =
  | '1限'
  | '授業'
  | '試験'
  | '発表'
  | '面接'
  | '仕事'
  | '朝活'
  | '旅行'
  | '特にない';

export type MoodType = '少し憂鬱' | '緊張している' | '疲れている' | '普通' | '楽しみ';

export type VoiceStyle = '優しく' | '明るく' | '背中を押して' | '面白く' | '落ち着いて';

export type MorningRequestStatus = 'draft' | 'open' | 'voice_assigned' | 'completed';

export type MorningRequest = {
  id: string;
  userId: string;
  wakeAt: string;
  schedules: ScheduleType[];
  mood: MoodType;
  preferredVoiceStyle: VoiceStyle;
  personalEligible: boolean;
  status: MorningRequestStatus;
  voiceCount: number;
  createdAt: string;
};
