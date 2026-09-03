import type { VoiceCheckResult, VoiceSafetyCategory } from '@/types';

const voiceSafetyCategories: VoiceSafetyCategory[] = [
  'safe',
  'insult',
  'hate',
  'sexual',
  'threat',
  'harassment',
  'irrelevant',
  'other',
];

export function validateVoiceCheckResult(value: unknown): VoiceCheckResult {
  if (!value || typeof value !== 'object') {
    return failedResult('invalid_result');
  }

  const candidate = value as Partial<VoiceCheckResult>;
  if (typeof candidate.safe !== 'boolean') {
    return failedResult('invalid_safe_flag');
  }

  const category = voiceSafetyCategories.includes(
    candidate.category as VoiceSafetyCategory
  )
    ? (candidate.category as VoiceSafetyCategory)
    : 'other';
  const reason =
    typeof candidate.reason === 'string' && candidate.reason.trim()
      ? candidate.reason.trim().slice(0, 240)
      : 'No reason was returned';

  return {
    safe: candidate.safe && category === 'safe',
    category: candidate.safe ? 'safe' : category,
    reason,
  };
}

export function failedResult(reason: string): VoiceCheckResult {
  return {
    safe: false,
    category: 'other',
    reason,
  };
}
