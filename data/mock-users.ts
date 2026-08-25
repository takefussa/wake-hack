import type { UserProfile } from '@/types';

export const mockUsers: UserProfile[] = [
  {
    id: 'user-yui',
    nickname: 'Takuma',
    avatarId: 'sky',
    userType: '大学生',
    tags: ['一人暮らし', '朝が苦手'],
    createdAt: '2026-02-01T09:00:00.000Z',
  },
  {
    id: 'user-takumi',
    nickname: 'Takumi',
    avatarId: 'ember',
    userType: '大学生',
    tags: ['朝が苦手'],
    createdAt: '2026-02-03T09:00:00.000Z',
  },
  {
    id: 'user-mio',
    nickname: 'Mio',
    avatarId: 'violet',
    userType: '受験生',
    tags: ['夜型'],
    createdAt: '2026-02-05T09:00:00.000Z',
  },
  {
    id: 'user-haruka',
    nickname: 'Haruka',
    avatarId: 'mint',
    userType: '社会人1年目',
    tags: ['一人暮らし'],
    createdAt: '2026-02-08T09:00:00.000Z',
  },
  {
    id: 'user-sota',
    nickname: 'Sota',
    avatarId: 'sunny',
    userType: '大学生',
    tags: ['朝活したい'],
    createdAt: '2026-02-11T09:00:00.000Z',
  },
  {
    id: 'user-noa',
    nickname: 'Noa',
    avatarId: 'luna',
    userType: '社会人',
    tags: ['夜型', '朝が苦手'],
    createdAt: '2026-02-12T09:00:00.000Z',
  },
  {
    id: 'user-ren',
    nickname: 'Ren',
    avatarId: 'sky',
    userType: '社会人',
    tags: ['朝活したい'],
    createdAt: '2026-02-14T09:00:00.000Z',
  },
  {
    id: 'user-aoi',
    nickname: 'Aoi',
    avatarId: 'violet',
    userType: 'その他',
    tags: ['一人暮らし'],
    createdAt: '2026-02-17T09:00:00.000Z',
  },
];

export function getMockUserById(userId: string): UserProfile | undefined {
  return mockUsers.find((user) => user.id === userId);
}
