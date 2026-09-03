import { logDevelopmentWarning } from '@/lib/development-logger';
import { getSupabaseClient } from '@/lib/supabase';
import type { MorningRequest, UserProfile } from '@/types';

type VoiceExampleInput = {
  recipient: UserProfile;
  request: MorningRequest;
};

type VoiceExampleResponse = {
  lines: string[];
};

class VoiceExampleService {
  async generate({ recipient, request }: VoiceExampleInput): Promise<string[]> {
    try {
      const { data, error } = await getSupabaseClient().functions.invoke<VoiceExampleResponse>(
        'generate-voice-example',
        {
          body: {
            recipient: {
              nickname: recipient.nickname,
              userType: recipient.userType,
              tags: recipient.tags,
              bio: recipient.bio,
            },
            morning: {
              schedules: request.schedules,
              mood: request.mood,
              preferredVoiceStyle: request.preferredVoiceStyle,
              voiceRequestNote: request.voiceRequestNote,
            },
          },
        }
      );

      if (error) throw error;

      const lines = data?.lines
        ?.filter((line): line is string => typeof line === 'string' && Boolean(line.trim()))
        .map((line) => line.trim());

      if (!lines || lines.length !== 2) {
        throw new Error('Voice example response is invalid');
      }

      return lines;
    } catch (error) {
      // This is an optional, best-effort prompt -- the record screen already
      // hides the card and continues the give flow on failure, so this isn't
      // treated as an app error (which would pop RN's intrusive full-screen
      // LogBox in dev builds).
      logDevelopmentWarning('voiceExample.generate', error);
      throw new Error('Voice example could not be generated');
    }
  }
}

export const voiceExampleService = new VoiceExampleService();
