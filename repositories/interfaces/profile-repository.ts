import type { CreateProfileInput, UserProfile } from '@/types';

export interface ProfileRepository {
  create(input: CreateProfileInput): Promise<UserProfile>;
  getById(id: string): Promise<UserProfile | null>;
  update(profile: UserProfile): Promise<UserProfile>;
}
