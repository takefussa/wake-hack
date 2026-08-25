import { MockProfileRepository } from '@/repositories/mock/mock-profile-repository';
import type { ProfileRepository } from '@/repositories/interfaces/profile-repository';
import type { CreateProfileInput, UserProfile } from '@/types';

export class ProfileService {
  constructor(private readonly repository: ProfileRepository) {}

  async createProfile(input: CreateProfileInput): Promise<UserProfile> {
    return this.repository.create({
      ...input,
      nickname: input.nickname.trim(),
    });
  }

  async getProfile(id: string): Promise<UserProfile | null> {
    return this.repository.getById(id);
  }
}

export const profileService = new ProfileService(new MockProfileRepository());
