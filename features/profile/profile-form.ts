import { prototypeConfig } from '@/constants/config';
import type { CreateProfileInput } from '@/types';

export function isProfileInputValid(input: CreateProfileInput): boolean {
  const nicknameLength = input.nickname.trim().length;
  return nicknameLength > 0 && nicknameLength <= prototypeConfig.profileNicknameMaxLength;
}
