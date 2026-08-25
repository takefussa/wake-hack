import type { ProfileRepository } from '@/repositories/interfaces/profile-repository';
import type { CreateProfileInput, UserProfile } from '@/types';

export class MockProfileRepository implements ProfileRepository {
  async create(input: CreateProfileInput): Promise<UserProfile> {
    return {
      ...input,
      id: `profile-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
  }
}
