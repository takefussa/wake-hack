import * as Crypto from 'expo-crypto';
import { File } from 'expo-file-system';

import { getSupabaseClient } from '@/lib/supabase';
import { authService } from '@/services/auth-service';
import type { VoiceMessage, VoiceStyle } from '@/types';

const voiceBucket = 'voice-messages';

type CreateCommunityVoiceInput = {
  senderId: string;
  uri: string;
  durationMs: number;
  voiceStyle: VoiceStyle;
};

function isMissingColumnError(error: { code?: string; message?: string } | null): boolean {
  return (
    error?.code === '42703' ||
    error?.code === 'PGRST204' ||
    error?.message?.includes('column') === true
  );
}

/** Stores Community Voice separately from one-to-one Personal Voice. */
export class CommunityVoiceService {
  async create(input: CreateCommunityVoiceInput): Promise<VoiceMessage> {
    const authenticatedUserId = authService.getAuthenticatedUserId();
    if (input.senderId !== authenticatedUserId) {
      throw new Error('Community Voice sender does not match the authenticated user');
    }

    const file = new File(input.uri);
    if (!file.exists) throw new Error('The local community recording does not exist');
    const audioData = await file.arrayBuffer();
    if (audioData.byteLength === 0) throw new Error('The local community recording is empty');

    const id = Crypto.randomUUID();
    // Preserve the original Supabase-social storage contract: the existing
    // bucket accepts audio/mp4 metadata even though iOS records PCM WAV bytes.
    // AlarmKit checks the WAV header after download before installing it.
    const storagePath = `community/${authenticatedUserId}/${id}.wav`;
    const supabase = getSupabaseClient();
    const { error: uploadError } = await supabase.storage
      .from(voiceBucket)
      .upload(storagePath, audioData, {
        cacheControl: '3600',
        contentType: 'audio/mp4',
        upsert: false,
      });
    if (uploadError) throw uploadError;

    try {
      const legacyValues = {
        id,
        sender_id: authenticatedUserId,
        audio_path: storagePath,
        duration_ms: input.durationMs,
      };
      let result = await supabase
        .from('community_voices')
        .insert({
          // The existing Supabase-social table uses audio_path. A later
          // migration may add voice_style; fall back below when it has not.
          ...legacyValues,
          voice_style: input.voiceStyle,
        })
        .select('*')
        .single();

      if (isMissingColumnError(result.error)) {
        // Exact compatibility with the deployed Supabase-social schema.
        result = await supabase
          .from('community_voices')
          .insert(legacyValues)
          .select('*')
          .single();
      }

      // Fresh installations made from migration 014 use storage_path rather
      // than the legacy audio_path column.
      if (isMissingColumnError(result.error)) {
        result = await supabase
          .from('community_voices')
          .insert({
            id,
            sender_id: authenticatedUserId,
            storage_path: storagePath,
            duration_ms: input.durationMs,
            voice_style: input.voiceStyle,
          })
          .select('*')
          .single();
      }

      if (result.error) throw result.error;
      const data = result.data;

      return {
        id: data.id,
        senderId: data.sender_id,
        uri: input.uri,
        storagePath: data.audio_path ?? data.storage_path ?? storagePath,
        durationMs: data.duration_ms,
        type: 'community',
        voiceStyle: input.voiceStyle,
        createdAt: data.created_at,
      };
    } catch (error) {
      await supabase.storage.from(voiceBucket).remove([storagePath]);
      throw error;
    }
  }
}

export const communityVoiceService = new CommunityVoiceService();
