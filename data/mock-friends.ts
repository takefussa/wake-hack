import type { Friendship } from '@/types';

export const mockFriendships: Friendship[] = [
  {
    id: 'friendship-sota',
    userAId: 'current-user',
    userBId: 'user-sota',
    userARequested: true,
    userBRequested: true,
    status: 'matched',
    morningCount: 2,
    createdAt: '2026-08-14T02:00:00.000Z',
  },
];
