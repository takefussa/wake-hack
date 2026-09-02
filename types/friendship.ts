export type FriendshipStatus = 'pending' | 'matched';

export type Friendship = {
  id: string;
  userAId: string;
  userBId: string;
  userARequested: boolean;
  userBRequested: boolean;
  status: FriendshipStatus;
  morningCount: number;
  createdAt: string;
};

export type RequestFriendshipInput = {
  requesterId: string;
  otherUserId: string;
  sourceVoiceMessageId: string;
  morningCount: number;
};
