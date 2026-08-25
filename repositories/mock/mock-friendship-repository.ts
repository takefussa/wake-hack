import type { FriendshipRepository } from '@/repositories/interfaces/friendship-repository';
import type { CreateFriendshipInput, Friendship } from '@/types';

const demoMatchDelayMs = 650;

export class MockFriendshipRepository implements FriendshipRepository {
  async createPending(input: CreateFriendshipInput): Promise<Friendship> {
    return {
      ...input,
      id: `friendship-${Date.now()}-${input.userBId}`,
      status: 'pending',
      createdAt: new Date().toISOString(),
    };
  }

  async match(friendship: Friendship): Promise<Friendship> {
    await new Promise((resolve) => setTimeout(resolve, demoMatchDelayMs));
    return { ...friendship, status: 'matched' };
  }
}
