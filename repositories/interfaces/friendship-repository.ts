import type { Friendship, RequestFriendshipInput } from '@/types';

export interface FriendshipRepository {
  request(input: RequestFriendshipInput): Promise<Friendship>;
  respond(friendshipId: string): Promise<Friendship>;
  getForUser(userId: string): Promise<Friendship[]>;
}
