import { DemoProfileRepository } from '@/repositories/demo/demo-profile-repository';
import { MockProfileRepository } from '@/repositories/mock/mock-profile-repository';
import type { ProfileRepository } from '@/repositories/interfaces/profile-repository';
import { SupabaseProfileRepository } from '@/repositories/supabase/supabase-profile-repository';
import { isDemoMode } from '@/features/demo/demo-mode';
import { logDevelopmentError } from '@/lib/development-logger';
import { authService } from '@/services/auth-service';
import type { CreateProfileInput, UpdateProfileInput, UserProfile } from '@/types';

function normalizeProfileInput(input: CreateProfileInput): CreateProfileInput {
  return {
    avatarId: input.avatarId,
    nickname: input.nickname.trim(),
    profileImageUri: input.profileImageUri?.trim() || undefined,
    bio: input.bio?.trim() || undefined,
    userType: input.userType,
    tags: input.tags,
  };
}

export class ProfileService {
  constructor(
    private readonly repository: ProfileRepository,
    private readonly mockRepository: ProfileRepository
  ) {}

  async createProfile(input: CreateProfileInput): Promise<UserProfile> {
    try {
      const authenticatedUser =
        authService.getAuthenticatedUserIdOrNull() ??
        (await authService.initializeSession()).id;

      return await this.repository.create(
        authenticatedUser,
        normalizeProfileInput(input)
      );
    } catch (error) {
      logDevelopmentError('profile.create', error);
      throw error;
    }
  }

  async getCurrentProfile(userId: string): Promise<UserProfile | null> {
    try {
      if (userId !== authService.getAuthenticatedUserId()) {
        throw new Error('Profile user does not match the authenticated user');
      }
      return await this.repository.getById(userId);
    } catch (error) {
      logDevelopmentError('profile.getCurrent', error);
      throw error;
    }
  }

  async getProfile(id: string): Promise<UserProfile | null> {
    const mockProfile = await this.mockRepository.getById(id);
    if (mockProfile) return mockProfile;

    try {
      return await this.repository.getById(id);
    } catch (error) {
      logDevelopmentError('profile.get', error);
      return null;
    }
  }

  async updateProfile(
    currentProfile: UserProfile,
    input: UpdateProfileInput
  ): Promise<UserProfile> {
    try {
      if (currentProfile.id !== authService.getAuthenticatedUserId()) {
        throw new Error('Profile user does not match the authenticated user');
      }
      const normalizedInput = normalizeProfileInput(input);
      return await this.repository.update({
        ...currentProfile,
        ...normalizedInput,
        profileImagePath: input.removeProfileImage
          ? undefined
          : currentProfile.profileImagePath,
      });
    } catch (error) {
      logDevelopmentError('profile.update', error);
      throw error;
    }
  }

  async deleteCurrentProfile(): Promise<void> {
    try {
      await this.repository.delete(authService.getAuthenticatedUserId());
    } catch (error) {
      logDevelopmentError('profile.deleteCurrent', error);
      throw error;
    }
  }
}

export const profileService = new ProfileService(
  isDemoMode ? new DemoProfileRepository() : new SupabaseProfileRepository(),
  new MockProfileRepository()
);
