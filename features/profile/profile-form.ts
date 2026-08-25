import { prototypeConfig } from '@/constants/config';
import type { CreateProfileInput, ProfileTag } from '@/types';

export function toggleProfileTag(tags: ProfileTag[], tag: ProfileTag): ProfileTag[] {
  return tags.includes(tag) ? tags.filter((item) => item !== tag) : [...tags, tag];
}

export function isProfileInputValid(input: CreateProfileInput): boolean {
  const nicknameLength = input.nickname.trim().length;
  return nicknameLength > 0 && nicknameLength <= prototypeConfig.profileNicknameMaxLength;
}
