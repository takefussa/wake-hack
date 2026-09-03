import AsyncStorage from '@react-native-async-storage/async-storage';

import { logDevelopmentError } from '@/lib/development-logger';
import type { ProfileRepository } from '@/repositories/interfaces/profile-repository';
import type { CreateProfileInput, UserProfile } from '@/types';

const demoProfileStorageKey = '@wake-hack/demo-profile';

function parseProfile(value: string | null): UserProfile | null {
  if (!value) return null;

  try {
    const parsed: unknown = JSON.parse(value);
    if (
      typeof parsed !== 'object' ||
      parsed === null ||
      !('id' in parsed) ||
      typeof parsed.id !== 'string'
    ) {
      return null;
    }
    return parsed as UserProfile;
  } catch (error) {
    logDevelopmentError('demoProfile.parse', error);
    return null;
  }
}

export class DemoProfileRepository implements ProfileRepository {
  async create(userId: string, input: CreateProfileInput): Promise<UserProfile> {
    const profile: UserProfile = {
      ...input,
      id: userId,
      createdAt: new Date().toISOString(),
    };
    await AsyncStorage.setItem(demoProfileStorageKey, JSON.stringify(profile));
    return profile;
  }

  async getById(id: string): Promise<UserProfile | null> {
    const profile = parseProfile(
      await AsyncStorage.getItem(demoProfileStorageKey)
    );
    return profile?.id === id ? profile : null;
  }

  async update(profile: UserProfile): Promise<UserProfile> {
    await AsyncStorage.setItem(demoProfileStorageKey, JSON.stringify(profile));
    return profile;
  }

  async delete(): Promise<void> {
    await AsyncStorage.removeItem(demoProfileStorageKey);
  }
}
