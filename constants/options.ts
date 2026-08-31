import type {
  AvatarId,
  LifeRhythm,
  MoodType,
  ScheduleType,
  UserType,
  VoiceStyle,
} from '@/types';

export type AvatarOption = {
  id: AvatarId;
  label: string;
  background: string;
  foreground: string;
  initial: string;
};

export const avatarOptions: AvatarOption[] = [
  { id: 'luna', label: 'ネイビー', background: '#D9DFE8', foreground: '#3B4E69', initial: 'A' },
  { id: 'sunny', label: 'オーカー', background: '#EEE1C9', foreground: '#6B5637', initial: 'K' },
  { id: 'sky', label: 'ブルー', background: '#DCE7EC', foreground: '#3D5967', initial: 'S' },
  { id: 'violet', label: 'モーヴ', background: '#E2DEE7', foreground: '#5B5268', initial: 'M' },
  { id: 'ember', label: 'テラコッタ', background: '#E9D8D1', foreground: '#674C42', initial: 'H' },
  { id: 'mint', label: 'セージ', background: '#DCE5DE', foreground: '#496056', initial: 'Y' },
];

export const userTypeOptions: UserType[] = ['中高生', '大学生・専門学生', '社会人', 'その他'];

export const lifeRhythmOptions: LifeRhythm[] = ['朝型', '夜型', '不規則'];

export const scheduleOptions: ScheduleType[] = [
  '1限',
  '授業',
  '試験',
  '発表',
  '面接',
  '仕事',
  '朝活',
  '旅行',
  '特にない',
];

export const moodOptions: MoodType[] = ['少し憂鬱', '緊張している', '疲れている', '普通', '楽しみ'];

export const voiceStyleOptions: VoiceStyle[] = [
  'そっと優しく',
  '明るく元気に',
  '渇を入れて',
  '面白く愉快に',
];

export const quickWakeTimes = ['06:30', '07:00', '07:30', '08:00'] as const;

export const thanksReactionOptions = [
  '起きられた！',
  'ありがとう',
  '今日も頑張れそう',
  '元気が出た',
] as const;
