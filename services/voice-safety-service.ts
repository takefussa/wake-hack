import { validateVoiceCheckResult } from '@/features/voice-safety/validate-voice-check-result';
import { logDevelopmentError } from '@/lib/development-logger';
import { getSupabaseClient } from '@/lib/supabase';
import type { VoiceCheckInput, VoiceCheckResult } from '@/types';

export class VoiceSafetyRejectedError extends Error {
  constructor(readonly result: VoiceCheckResult) {
    super('Voice safety check rejected the recording');
    this.name = 'VoiceSafetyRejectedError';
  }
}

export class VoiceSafetyUnavailableError extends Error {
  constructor(message = 'Voice safety check is unavailable') {
    super(message);
    this.name = 'VoiceSafetyUnavailableError';
  }
}

export class VoiceSafetyService {
  async checkVoiceSafety(input: VoiceCheckInput): Promise<VoiceCheckResult> {
    try {
      const { data, error } = await getSupabaseClient().functions.invoke(
        'check-voice-safety',
        {
          body: input,
        }
      );

      if (error) {
        throw new VoiceSafetyUnavailableError(await getFunctionErrorMessage(error));
      }

      return validateVoiceCheckResult(data);
    } catch (error) {
      if (error instanceof VoiceSafetyUnavailableError) throw error;
      logDevelopmentError('voiceSafety.check', error);
      throw new VoiceSafetyUnavailableError();
    }
  }

  async assertVoiceIsSafe(input: VoiceCheckInput): Promise<VoiceCheckResult> {
    const result = await this.checkVoiceSafety(input);
    if (!result.safe) {
      throw new VoiceSafetyRejectedError(result);
    }
    return result;
  }
}

export const voiceSafetyService = new VoiceSafetyService();

async function getFunctionErrorMessage(error: unknown): Promise<string> {
  const fallbackMessage =
    error instanceof Error ? error.message : 'Voice safety check is unavailable';
  const context = (error as { context?: unknown })?.context;

  if (!context || !(context instanceof Response)) {
    return fallbackMessage;
  }

  try {
    const body = await context.text();
    return body
      ? `${fallbackMessage}: ${context.status} ${body.slice(0, 300)}`
      : `${fallbackMessage}: ${context.status}`;
  } catch {
    return `${fallbackMessage}: ${context.status}`;
  }
}
