import type { FriendshipRepository } from '@/repositories/interfaces/friendship-repository';
import type { Friendship, RequestFriendshipInput } from '@/types';

const demoMatchDelayMs = 650;

export class MockFriendshipRepository implements FriendshipRepository {
  async request(input: RequestFriendshipInput): Promise<Friendship> {
    return {
      id: `friendship-${Date.now()}-${input.otherUserId}`,
      userAId: input.requesterId,
      userBId: input.otherUserId,
      status: 'pending',
      morningCount: input.morningCount,
      createdAt: new Date().toISOString(),
    };
  }

  async getForUser(): Promise<Friendship[]> {
    return [];
  }

  async match(friendship: Friendship): Promise<Friendship> {
    await new Promise((resolve) => setTimeout(resolve, demoMatchDelayMs));
    return { ...friendship, status: 'matched' };
  }
}
