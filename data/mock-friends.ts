import type { Friendship } from '@/types';

export const mockFriendships: Friendship[] = [
  {
    id: 'friendship-yui',
    userAId: 'current-user',
    userBId: 'user-yui',
    status: 'matched',
    morningCount: 3,
    createdAt: '2026-08-10T02:00:00.000Z',
  },
  {
    id: 'friendship-sota',
    userAId: 'current-user',
    userBId: 'user-sota',
    status: 'matched',
    morningCount: 2,
    createdAt: '2026-08-14T02:00:00.000Z',
  },
];
