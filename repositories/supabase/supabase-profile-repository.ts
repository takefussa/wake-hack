import { avatarOptions, profileTagOptions, userTypeOptions } from '@/constants/options';
import { getSupabaseClient } from '@/lib/supabase';
import type { ProfileRepository } from '@/repositories/interfaces/profile-repository';
import type {
  AvatarId,
  CreateProfileInput,
  ProfileRow,
  ProfileTag,
  UserProfile,
  UserType,
} from '@/types';

const profileColumns =
  'id,nickname,avatar_id,user_type,tags,created_at,updated_at' as const;

function isAvatarId(value: string): value is AvatarId {
  return avatarOptions.some((option) => option.id === value);
}

function isUserType(value: string): value is UserType {
  return userTypeOptions.some((option) => option === value);
}

function isProfileTag(value: string): value is ProfileTag {
  return profileTagOptions.some((option) => option === value);
}

function mapProfileRow(row: ProfileRow): UserProfile {
  return {
    id: row.id,
    nickname: row.nickname,
    avatarId: isAvatarId(row.avatar_id) ? row.avatar_id : 'luna',
    userType: isUserType(row.user_type) ? row.user_type : 'その他',
    tags: row.tags.filter(isProfileTag),
    createdAt: row.created_at,
  };
}

function toProfileValues(input: CreateProfileInput) {
  return {
    nickname: input.nickname,
    avatar_id: input.avatarId,
    user_type: input.userType,
    tags: input.tags,
    updated_at: new Date().toISOString(),
  };
}

export class SupabaseProfileRepository implements ProfileRepository {
  async create(userId: string, input: CreateProfileInput): Promise<UserProfile> {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('profiles')
      .upsert(
        {
          id: userId,
          ...toProfileValues(input),
        },
        { onConflict: 'id' }
      )
      .select(profileColumns)
      .single();

    if (error) throw error;

    return {
      ...mapProfileRow(data),
      profileImageUri: input.profileImageUri,
      bio: input.bio,
    };
  }

  async getById(id: string): Promise<UserProfile | null> {
    const supabase = getSupabaseClient();
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
    const { data, error } = await supabase
      .from('profiles')
      .update(toProfileValues(profile))
      .eq('id', profile.id)
      .select(profileColumns)
      .single();

    if (error) throw error;

    return {
      ...mapProfileRow(data),
      profileImageUri: profile.profileImageUri,
      bio: profile.bio,
    };
  }

  async delete(id: string): Promise<void> {
    const { error } = await getSupabaseClient()
      .from('profiles')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }
}
