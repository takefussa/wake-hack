import type { FriendshipRepository } from '@/repositories/interfaces/friendship-repository';
import type { Friendship, RequestFriendshipInput } from '@/types';

const demoMatchDelayMs = 650;

export class MockFriendshipRepository implements FriendshipRepository {
  async request(input: RequestFriendshipInput): Promise<Friendship> {
    return {
      id: `friendship-${Date.now()}-${input.otherUserId}`,
      userAId: input.requesterId,
      userBId: input.otherUserId,
      userARequested: true,
      userBRequested: false,
      status: 'pending',
      morningCount: input.morningCount,
      createdAt: new Date().toISOString(),
    };
  }

  async respond(friendshipId: string): Promise<Friendship> {
    throw new Error(`Mock friendship ${friendshipId} must be resolved from local state`);
  }

  async getForUser(): Promise<Friendship[]> {
    return [];
  }

  async match(friendship: Friendship): Promise<Friendship> {
    await new Promise((resolve) => setTimeout(resolve, demoMatchDelayMs));
    return {
      ...friendship,
      userARequested: true,
      userBRequested: true,
      status: 'matched',
    };
  }
}
