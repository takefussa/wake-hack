import type { CreateFriendshipInput, Friendship } from '@/types';

export interface FriendshipRepository {
  createPending(input: CreateFriendshipInput): Promise<Friendship>;
  match(friendship: Friendship): Promise<Friendship>;
}
