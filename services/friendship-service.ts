import { demoWakeSenderId } from '@/data/demo-scenario';
import { isSupabaseUuid } from '@/lib/identifiers';
import { logDevelopmentError } from '@/lib/development-logger';
import type { FriendshipRepository } from '@/repositories/interfaces/friendship-repository';
import { MockFriendshipRepository } from '@/repositories/mock/mock-friendship-repository';
import { SupabaseFriendshipRepository } from '@/repositories/supabase/supabase-friendship-repository';
import type { Friendship } from '@/types';

export class FriendshipService {
  constructor(
    private readonly repository: FriendshipRepository,
    private readonly mockRepository: MockFriendshipRepository
  ) {}

  async request(
    requesterId: string,
    otherUserId: string,
    sourceVoiceMessageId: string
  ): Promise<Friendship> {
    if (!requesterId || !otherUserId || requesterId === otherUserId) {
      throw new Error('Friendship users are invalid');
    }

    const repository =
      isSupabaseUuid(requesterId) &&
      isSupabaseUuid(otherUserId) &&
      isSupabaseUuid(sourceVoiceMessageId)
        ? this.repository
        : this.mockRepository;

    try {
      return await repository.request({
        requesterId,
        otherUserId,
        sourceVoiceMessageId,
        morningCount: 1,
      });
    } catch (error) {
      logDevelopmentError('friendship.request', error);
      throw error;
    }
  }

  shouldAutoMatch(friendship: Friendship): boolean {
    return (
      friendship.userAId === demoWakeSenderId ||
      friendship.userBId === demoWakeSenderId
    );
  }

  async resolveDemoMatch(friendship: Friendship): Promise<Friendship> {
    if (
      !this.shouldAutoMatch(friendship) ||
      (isSupabaseUuid(friendship.userAId) && isSupabaseUuid(friendship.userBId))
    ) {
      return friendship;
    }
    return this.mockRepository.match(friendship);
  }

  async getForUser(
    userId: string,
    localFriendships: Friendship[]
  ): Promise<Friendship[]> {
    if (!isSupabaseUuid(userId)) return localFriendships;

    try {
      const remoteFriendships = await this.repository.getForUser(userId);
      const localMockFriendships = localFriendships.filter(
        (friendship) =>
          !isSupabaseUuid(friendship.userAId) ||
          !isSupabaseUuid(friendship.userBId)
      );
      return [...remoteFriendships, ...localMockFriendships];
    } catch (error) {
      logDevelopmentError('friendship.getForUser', error);
      throw error;
    }
  }

  async getBetween(
    userId: string,
    otherUserId: string,
    localFriendships: Friendship[]
  ): Promise<Friendship | null> {
    const available =
      isSupabaseUuid(userId) && isSupabaseUuid(otherUserId)
        ? await this.getForUser(userId, localFriendships)
        : localFriendships;

    return (
      available.find(
        (friendship) =>
          (friendship.userAId === userId && friendship.userBId === otherUserId) ||
          (friendship.userAId === otherUserId && friendship.userBId === userId)
      ) ?? null
    );
  }
}

export const friendshipService = new FriendshipService(
  new SupabaseFriendshipRepository(),
  new MockFriendshipRepository()
);
