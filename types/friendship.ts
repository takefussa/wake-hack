export type FriendshipStatus = 'pending' | 'matched';

export type Friendship = {
  id: string;
  userAId: string;
  userBId: string;
  status: FriendshipStatus;
  morningCount: number;
  createdAt: string;
};
