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
  selectable?: boolean;
};

export const avatarOptions: AvatarOption[] = [
  { id: 'sunny', label: 'ロボット', background: '#F2F7FF', foreground: '#4C5C94', initial: 'R' },
  { id: 'sky', label: 'ねこ', background: '#F2F7FF', foreground: '#4C5C94', initial: 'C' },
  { id: 'ember', label: '宇宙人', background: '#F2F7FF', foreground: '#4C5C94', initial: 'A' },
  { id: 'luna', label: '青い髪の男の子', background: '#F2F7FF', foreground: '#4C5C94', initial: 'B' },
  { id: 'violet', label: 'ショートヘアの男の子', background: '#F2F7FF', foreground: '#4C5C94', initial: 'S' },
  // 以前保存されたプロフィールとの互換性用。新しい選択肢には表示しない。
  { id: 'mint', label: '以前のアイコン', background: '#F2F7FF', foreground: '#4C5C94', initial: 'B', selectable: false },
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
  'その他',
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
