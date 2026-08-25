import type { CreateProfileInput, UserProfile } from '@/types';

export interface ProfileRepository {
  create(userId: string, input: CreateProfileInput): Promise<UserProfile>;
  getById(id: string): Promise<UserProfile | null>;
  update(profile: UserProfile): Promise<UserProfile>;
  delete(id: string): Promise<void>;
}
