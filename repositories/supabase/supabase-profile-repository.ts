import * as Crypto from 'expo-crypto';
import { File } from 'expo-file-system';

import { avatarOptions, lifeRhythmOptions, userTypeOptions } from '@/constants/options';
import { logDevelopmentError } from '@/lib/development-logger';
import { getSupabaseClient } from '@/lib/supabase';
import type { ProfileRepository } from '@/repositories/interfaces/profile-repository';
import type {
  AvatarId,
  CreateProfileInput,
  LifeRhythm,
  ProfileRow,
  UserProfile,
  UserType,
} from '@/types';

type LegacyProfileRow = Omit<ProfileRow, 'bio' | 'profile_image_path'>;

const profileImageBucket = 'profile-images';
const profileImageMaxBytes = 5 * 1024 * 1024;
const profileImageSignedUrlSeconds = 60 * 60 * 24 * 7;
const legacyProfileColumns =
  'id,nickname,avatar_id,user_type,tags,created_at,updated_at' as const;
const profileColumns =
  'id,nickname,avatar_id,bio,profile_image_path,user_type,tags,created_at,updated_at' as const;

let hasExtendedProfileSchema = false;

function isAvatarId(value: string): value is AvatarId {
  return avatarOptions.some((option) => option.id === value);
}

function isUserType(value: string): value is UserType {
  return userTypeOptions.some((option) => option === value);
}

function isLifeRhythm(value: string): value is LifeRhythm {
  return lifeRhythmOptions.some((option) => option === value);
}

function mapLegacyProfileRow(row: LegacyProfileRow): UserProfile {
  return {
    id: row.id,
    nickname: row.nickname,
    avatarId: isAvatarId(row.avatar_id) ? row.avatar_id : 'luna',
    userType: isUserType(row.user_type) ? row.user_type : 'その他',
    tags: row.tags.filter(isLifeRhythm),
    createdAt: row.created_at,
    profileDetailsSynced: false,
  };
}

function readErrorCode(error: unknown): string | null {
  if (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    typeof error.code === 'string'
  ) {
    return error.code;
  }
  return null;
}

async function getProfileSchemaMode(): Promise<'legacy' | 'extended'> {
  if (hasExtendedProfileSchema) return 'extended';

  const { error } = await getSupabaseClient()
    .from('profiles')
    .select('bio,profile_image_path')
    .limit(0);

  if (!error) {
    hasExtendedProfileSchema = true;
    return 'extended';
  }
  if (readErrorCode(error) === '42703') {
    return 'legacy';
  }
  throw error;
}

async function mapProfileRow(row: ProfileRow): Promise<UserProfile> {
  let profileImageUri: string | undefined;
  if (row.profile_image_path) {
    const { data, error } = await getSupabaseClient()
      .storage
      .from(profileImageBucket)
      .createSignedUrl(row.profile_image_path, profileImageSignedUrlSeconds);
    if (error) {
      logDevelopmentError('profile.image.sign', error);
    } else {
      profileImageUri = data.signedUrl;
    }
  }

  return {
    ...mapLegacyProfileRow(row),
    bio: row.bio ?? undefined,
    profileImagePath: row.profile_image_path ?? undefined,
    profileImageUri,
    profileDetailsSynced: true,
  };
}

function toLegacyProfileValues(input: CreateProfileInput) {
  return {
    nickname: input.nickname,
    avatar_id: input.avatarId,
    user_type: input.userType,
    tags: input.tags,
    updated_at: new Date().toISOString(),
  };
}

function isRemoteUri(uri: string): boolean {
  return uri.startsWith('https://') || uri.startsWith('http://');
}

function resolveImageType(file: File): { contentType: string; extension: string } {
  const normalizedType = file.type.toLowerCase();
  const normalizedExtension = file.extension.toLowerCase().replace(/^\./, '');
  if (normalizedType === 'image/png' || normalizedExtension === 'png') {
    return { contentType: 'image/png', extension: 'png' };
  }
  if (normalizedType === 'image/webp' || normalizedExtension === 'webp') {
    return { contentType: 'image/webp', extension: 'webp' };
  }
  if (
    normalizedType === 'image/heic' ||
    normalizedType === 'image/heif' ||
    normalizedExtension === 'heic' ||
    normalizedExtension === 'heif'
  ) {
    return {
      contentType: normalizedType === 'image/heif' ? 'image/heif' : 'image/heic',
      extension: normalizedType === 'image/heif' ? 'heif' : 'heic',
    };
  }
  if (
    normalizedType === 'image/jpeg' ||
    normalizedExtension === 'jpg' ||
    normalizedExtension === 'jpeg'
  ) {
    return { contentType: 'image/jpeg', extension: 'jpg' };
  }
  throw new Error('The selected profile image format is not supported');
}

async function uploadProfileImage(userId: string, uri: string): Promise<string> {
  const file = new File(uri);
  if (!file.exists) {
    throw new Error('The selected profile image does not exist');
  }
  if (file.size <= 0 || file.size > profileImageMaxBytes) {
    throw new Error('The selected profile image size is invalid');
  }

  const { contentType, extension } = resolveImageType(file);
  const imageData = await file.arrayBuffer();
  if (imageData.byteLength <= 0 || imageData.byteLength > profileImageMaxBytes) {
    throw new Error('The selected profile image data is invalid');
  }

  const path = `${userId}/${Crypto.randomUUID()}.${extension}`;
  const { error } = await getSupabaseClient()
    .storage
    .from(profileImageBucket)
    .upload(path, imageData, {
      cacheControl: '3600',
      contentType,
      upsert: false,
    });
  if (error) throw error;
  return path;
}

async function removeProfileImage(path: string): Promise<void> {
  const { error } = await getSupabaseClient()
    .storage
    .from(profileImageBucket)
    .remove([path]);
  if (error) {
    logDevelopmentError('profile.image.remove', error);
  }
}

export class SupabaseProfileRepository implements ProfileRepository {
  async create(userId: string, input: CreateProfileInput): Promise<UserProfile> {
    const supabase = getSupabaseClient();
    const schemaMode = await getProfileSchemaMode();
    if (schemaMode === 'legacy') {
      const { data, error } = await supabase
        .from('profiles')
        .upsert(
          {
            id: userId,
            ...toLegacyProfileValues(input),
          },
          { onConflict: 'id' }
        )
        .select(legacyProfileColumns)
        .single();
      if (error) throw error;
      return {
        ...mapLegacyProfileRow(data),
        bio: input.bio,
        profileImageUri: input.profileImageUri,
      };
    }

    let uploadedImagePath: string | null = null;
    if (input.profileImageUri) {
      if (isRemoteUri(input.profileImageUri)) {
        throw new Error('A new profile cannot use a remote image URI');
      }
      uploadedImagePath = await uploadProfileImage(userId, input.profileImageUri);
    }

    const values = {
      ...toLegacyProfileValues(input),
      bio: input.bio ?? null,
      profile_image_path: uploadedImagePath,
    };
    const { data, error } = await supabase
      .from('profiles')
      .upsert(
        {
          id: userId,
          ...values,
        },
        { onConflict: 'id' }
      )
      .select(profileColumns)
      .single();

    if (error) {
      if (uploadedImagePath) await removeProfileImage(uploadedImagePath);
      throw error;
    }

    return mapProfileRow(data);
  }

  async getById(id: string): Promise<UserProfile | null> {
    const supabase = getSupabaseClient();
    const schemaMode = await getProfileSchemaMode();
    if (schemaMode === 'legacy') {
      const { data, error } = await supabase
        .from('profiles')
        .select(legacyProfileColumns)
        .eq('id', id)
        .maybeSingle();
      if (error) throw error;
      return data ? mapLegacyProfileRow(data) : null;
    }

    const { data, error } = await supabase
      .from('profiles')
      .select(profileColumns)
      .eq('id', id)
      .maybeSingle();

    if (error) throw error;
    return data ? mapProfileRow(data) : null;
  }

  async update(profile: UserProfile): Promise<UserProfile> {
    const supabase = getSupabaseClient();
    const schemaMode = await getProfileSchemaMode();
    if (schemaMode === 'legacy') {
      const { data, error } = await supabase
        .from('profiles')
        .update(toLegacyProfileValues(profile))
        .eq('id', profile.id)
        .select(legacyProfileColumns)
        .single();
      if (error) throw error;
      return {
        ...mapLegacyProfileRow(data),
        bio: profile.bio,
        profileImageUri: profile.profileImageUri,
      };
    }

    const previousImagePath = profile.profileImagePath ?? null;
    let nextImagePath = previousImagePath;
    let uploadedImagePath: string | null = null;
    if (profile.profileImageUri && !isRemoteUri(profile.profileImageUri)) {
      uploadedImagePath = await uploadProfileImage(profile.id, profile.profileImageUri);
      nextImagePath = uploadedImagePath;
    }

    const { data, error } = await supabase
      .from('profiles')
      .update({
        ...toLegacyProfileValues(profile),
        bio: profile.bio ?? null,
        profile_image_path: nextImagePath,
      })
      .eq('id', profile.id)
      .select(profileColumns)
      .single();

    if (error) {
      if (uploadedImagePath) await removeProfileImage(uploadedImagePath);
      throw error;
    }
    if (previousImagePath && previousImagePath !== nextImagePath) {
      await removeProfileImage(previousImagePath);
    }

    return mapProfileRow(data);
  }

  async delete(id: string): Promise<void> {
    const schemaMode = await getProfileSchemaMode();
    let profileImagePath: string | null = null;
    if (schemaMode === 'extended') {
      const { data, error } = await getSupabaseClient()
        .from('profiles')
        .select('profile_image_path')
        .eq('id', id)
        .maybeSingle();
      if (error) throw error;
      profileImagePath = data?.profile_image_path ?? null;
    }

    const { error } = await getSupabaseClient()
      .from('profiles')
      .delete()
      .eq('id', id);

    if (error) throw error;
    if (profileImagePath) await removeProfileImage(profileImagePath);
  }
}
