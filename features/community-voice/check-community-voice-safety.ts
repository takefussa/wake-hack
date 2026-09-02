import type { CommunityVoiceModerationStatus, CreateCommunityVoiceInput } from '@/types';

export async function checkCommunityVoiceSafety(
  _input: CreateCommunityVoiceInput
): Promise<CommunityVoiceModerationStatus> {
  return 'approved';
}
