import { demoWakeSenderId } from '@/data/demo-scenario';
import type { FriendshipRepository } from '@/repositories/interfaces/friendship-repository';
import { MockFriendshipRepository } from '@/repositories/mock/mock-friendship-repository';
import type { Friendship } from '@/types';

export class FriendshipService {
  constructor(private readonly repository: FriendshipRepository) {}

  async request(userAId: string, userBId: string): Promise<Friendship> {
    if (!userAId || !userBId || userAId === userBId) {
      throw new Error('Friendship users are invalid');
    }

    return this.repository.createPending({ userAId, userBId, morningCount: 1 });
  }

  shouldAutoMatch(friendship: Friendship): boolean {
    return (
      friendship.userAId === demoWakeSenderId ||
      friendship.userBId === demoWakeSenderId
    );
  }

  async resolveDemoMatch(friendship: Friendship): Promise<Friendship> {
    if (!this.shouldAutoMatch(friendship)) return friendship;
    return this.repository.match(friendship);
  }
}

export const friendshipService = new FriendshipService(new MockFriendshipRepository());
