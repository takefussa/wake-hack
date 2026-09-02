import type { CreateMorningRequestInput, CreateProfileInput } from '@/types';

export const demoProfileDefaults: CreateProfileInput = {
  avatarId: 'luna',
  nickname: 'Ryo',
  userType: '大学生・専門学生',
  tags: ['夜型'],
};

export const demoMorningDefaults: CreateMorningRequestInput = {
  wakeAt: '07:00',
  schedules: ['1限'],
  mood: '少し憂鬱',
  preferredVoiceStyle: 'そっと優しく',
};

export const demoGiveReceiverId = 'user-takumi';
export const demoWakeSenderId = 'user-takuma';
