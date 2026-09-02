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
    // Recordings are PCM WAV on iOS so AlarmKit can install them without an
    // unreliable AAC conversion step.
    const storagePath = `community/${authenticatedUserId}/${id}.wav`;
    const supabase = getSupabaseClient();
    const { error: uploadError } = await supabase.storage
      .from(voiceBucket)
      .upload(storagePath, audioData, {
        cacheControl: '3600',
        contentType: 'audio/wav',
        upsert: false,
      });
    if (uploadError) throw uploadError;

    try {
      const { data, error } = await supabase
        .from('community_voices')
        .insert({
          id,
          sender_id: authenticatedUserId,
          storage_path: storagePath,
          duration_ms: input.durationMs,
          voice_style: input.voiceStyle,
        })
        .select('id,sender_id,storage_path,duration_ms,voice_style,created_at')
        .single();
      if (error) throw error;

      return {
        id: data.id,
        senderId: data.sender_id,
        uri: input.uri,
        storagePath: data.storage_path,
        durationMs: data.duration_ms,
        type: 'community',
        voiceStyle: data.voice_style as VoiceStyle,
        createdAt: data.created_at,
      };
    } catch (error) {
      await supabase.storage.from(voiceBucket).remove([storagePath]);
      throw error;
    }
  }
}

export const communityVoiceService = new CommunityVoiceService();
