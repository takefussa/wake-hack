import type { ThanksMessage } from '@/types';

export const mockThanksMessages: ThanksMessage[] = [
  {
    id: 'thanks-takumi',
    senderId: 'user-takumi',
    receiverId: 'current-user',
    sourceVoiceMessageId: 'given-to-takumi',
    type: 'text',
    content: '起きられました！発表、頑張ってきます。ありがとう！',
    createdAt: '2026-08-25T22:42:00.000Z',
  },
  {
    id: 'thanks-mio',
    senderId: 'user-mio',
    receiverId: 'current-user',
    sourceVoiceMessageId: 'given-to-mio',
    type: 'reaction',
    content: '声のおかげで落ち着いて起きられました。',
    createdAt: '2026-08-24T21:55:00.000Z',
  },
  {
    id: 'thanks-haruka',
    senderId: 'user-haruka',
    receiverId: 'current-user',
    sourceVoiceMessageId: 'given-to-haruka',
    type: 'text',
    content: '朝から少し元気が出ました。ありがとう。',
    createdAt: '2026-08-23T22:18:00.000Z',
  },
];
