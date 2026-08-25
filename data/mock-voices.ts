import type { VoiceMessage } from '@/types';

export const mockCommunityVoices: VoiceMessage[] = [
  {
    id: 'community-voice-1',
    senderId: 'community',
    uri: 'mock://community/01',
    durationMs: 6_400,
    type: 'community',
    transcript: 'おはようございます。今日も自分のペースでいきましょう。',
    createdAt: '2026-08-20T01:00:00.000Z',
  },
  {
    id: 'community-voice-2',
    senderId: 'community',
    uri: 'mock://community/02',
    durationMs: 7_100,
    type: 'community',
    transcript: '今日もいい朝になりますように。無理せずいきましょう。',
    createdAt: '2026-08-20T01:05:00.000Z',
  },
  {
    id: 'community-voice-3',
    senderId: 'community',
    uri: 'mock://community/03',
    durationMs: 5_800,
    type: 'community',
    transcript: '起きられた時点で大丈夫。ゆっくり朝を始めましょう。',
    createdAt: '2026-08-20T01:10:00.000Z',
  },
  {
    id: 'community-voice-4',
    senderId: 'community',
    uri: 'mock://community/04',
    durationMs: 6_900,
    type: 'community',
    transcript: 'おはよう。深呼吸をひとつして、今日を始めましょう。',
    createdAt: '2026-08-20T01:15:00.000Z',
  },
  {
    id: 'community-voice-5',
    senderId: 'community',
    uri: 'mock://community/05',
    durationMs: 7_600,
    type: 'community',
    transcript: '新しい朝です。小さな一歩から一緒に始めましょう。',
    createdAt: '2026-08-20T01:20:00.000Z',
  },
];

export const mockPersonalWakeVoice: VoiceMessage = {
  id: 'personal-voice-yui',
  senderId: 'user-yui',
  receiverId: 'current-user',
  morningRequestId: 'request-demo-current',
  uri: 'mock://personal/yui',
  durationMs: 8_200,
  type: 'personal',
  transcript: 'おはよう。今日1限なんですよね。私も朝が早いので、一緒に頑張りましょう。',
  createdAt: '2026-08-25T13:10:00.000Z',
};
