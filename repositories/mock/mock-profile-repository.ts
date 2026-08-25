import { getMockUserById } from '@/data/mock-users';
import type { ProfileRepository } from '@/repositories/interfaces/profile-repository';
import type { CreateProfileInput, UserProfile } from '@/types';

export class MockProfileRepository implements ProfileRepository {
  async create(userId: string, input: CreateProfileInput): Promise<UserProfile> {
    return {
      ...input,
      id: userId,
      createdAt: new Date().toISOString(),
    };
  }

  async getById(id: string): Promise<UserProfile | null> {
    return getMockUserById(id) ?? null;
  }

  async update(profile: UserProfile): Promise<UserProfile> {
    return profile;
  }

  async delete(): Promise<void> {}
}
