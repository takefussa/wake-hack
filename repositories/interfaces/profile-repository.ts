import type { CreateProfileInput, UserProfile } from '@/types';

export interface ProfileRepository {
  create(input: CreateProfileInput): Promise<UserProfile>;
}
