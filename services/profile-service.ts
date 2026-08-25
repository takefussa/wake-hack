import { MockProfileRepository } from '@/repositories/mock/mock-profile-repository';
import type { ProfileRepository } from '@/repositories/interfaces/profile-repository';
import type { CreateProfileInput, UpdateProfileInput, UserProfile } from '@/types';

function normalizeProfileInput(input: CreateProfileInput): CreateProfileInput {
  return {
    ...input,
    nickname: input.nickname.trim(),
    profileImageUri: input.profileImageUri?.trim() || undefined,
    bio: input.bio?.trim() || undefined,
  };
}

export class ProfileService {
  constructor(private readonly repository: ProfileRepository) {}

  async createProfile(input: CreateProfileInput): Promise<UserProfile> {
    return this.repository.create(normalizeProfileInput(input));
  }

  async getProfile(id: string): Promise<UserProfile | null> {
    return this.repository.getById(id);
  }

  async updateProfile(
    currentProfile: UserProfile,
    input: UpdateProfileInput
  ): Promise<UserProfile> {
    return this.repository.update({
      ...currentProfile,
      ...normalizeProfileInput(input),
    });
  }
}

export const profileService = new ProfileService(new MockProfileRepository());
