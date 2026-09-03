import * as Crypto from 'expo-crypto';
import { File } from 'expo-file-system';

import { getSupabaseClient } from '@/lib/supabase';
import { authService } from '@/services/auth-service';
import type { VoiceMessage, VoiceStyle } from '@/types';

const voiceBucket = 'voice-messages';
const legacyVoiceBucket = 'community-voices';

type CreateCommunityVoiceInput = {
  senderId: string;
  uri: string;
  durationMs: number;
  voiceStyle: VoiceStyle;
};

type LegacyCommunityVoiceRow = {
  id: string;
  sender_id: string;
  audio_path: string;
  duration_ms: number;
  created_at: string;
};

function isMissingColumnError(error: { code?: string; message?: string } | null): boolean {
  return (
    error?.code === '42703' ||
    error?.code === 'PGRST204' ||
    error?.message?.includes('column') === true
  );
}

function isMissingFunctionError(error: { code?: string; message?: string } | null): boolean {
  return error?.code === '42883' || error?.code === 'PGRST202' || error?.message?.includes('function') === true;
}

function toLegacyWakeStyle(style: VoiceStyle): 'gentle' | 'cheerful' | 'strict' | 'funny' {
  switch (style) {
    case '明るく元気に':
      return 'cheerful';
    case '渇を入れて':
      return 'strict';
    case '面白く愉快に':
      return 'funny';
    case 'そっと優しく':
    default:
      return 'gentle';
  }
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
    const supabase = getSupabaseClient();
    // Supabase-social (migration 006) used a dedicated bucket and the
    // create_community_voice RPC. Try that contract first so existing users
    // keep the exact behavior that already worked for them.
    const legacyPath = `${authenticatedUserId}/${id}.m4a`;
    const legacyUpload = await supabase.storage.from(legacyVoiceBucket).upload(
      legacyPath,
      audioData,
      { cacheControl: '3600', contentType: 'audio/mp4', upsert: false }
    );
    if (!legacyUpload.error) {
      try {
        const { data, error } = await supabase.rpc('create_community_voice' as never, {
          p_voice_id: id,
          p_audio_path: legacyPath,
          p_duration_ms: input.durationMs,
          p_wake_style: toLegacyWakeStyle(input.voiceStyle),
          p_moderation_status: 'approved',
        } as never).single() as unknown as {
          data: LegacyCommunityVoiceRow | null;
          error: { code?: string; message?: string } | null;
        };
        if (!error && data) {
          return {
            id: data.id,
            senderId: data.sender_id,
            uri: input.uri,
            storagePath: data.audio_path,
            durationMs: data.duration_ms,
            type: 'community',
            voiceStyle: input.voiceStyle,
            createdAt: data.created_at,
          };
        }
        await supabase.storage.from(legacyVoiceBucket).remove([legacyPath]);
        // If the old RPC is absent, continue with the modern table contract.
        if (error && !isMissingFunctionError(error)) {
          throw error;
        }
      } catch (error) {
        await supabase.storage.from(legacyVoiceBucket).remove([legacyPath]);
        throw error;
      }
    }

    // Fresh installations use voice-messages/community/<uid>/... and the
    // migration 014 table shape. WAV bytes are deliberately labelled mp4 to
    // remain accepted by buckets created by migration 003; AlarmKit detects
    // the WAV header after download.
    const storagePath = `community/${authenticatedUserId}/${id}.wav`;
    const { error: uploadError } = await supabase.storage.from(voiceBucket).upload(
      storagePath,
      audioData,
      { cacheControl: '3600', contentType: 'audio/mp4', upsert: false }
    );
    if (uploadError) throw uploadError;

    try {
      const legacyValues = { id, sender_id: authenticatedUserId, audio_path: storagePath, duration_ms: input.durationMs };
      let result = await supabase.from('community_voices').insert({ ...legacyValues, voice_style: input.voiceStyle }).select('*').single();
      if (isMissingColumnError(result.error)) {
        result = await supabase.from('community_voices').insert(legacyValues).select('*').single();
      }
      if (isMissingColumnError(result.error)) {
        result = await supabase.from('community_voices').insert({ id, sender_id: authenticatedUserId, storage_path: storagePath, duration_ms: input.durationMs, voice_style: input.voiceStyle }).select('*').single();
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
