import * as Crypto from 'expo-crypto';
import { File } from 'expo-file-system';

import { logDevelopmentError } from '@/lib/development-logger';
import { getSupabaseClient } from '@/lib/supabase';
import type { VoiceRepository } from '@/repositories/interfaces/voice-repository';
import { authService } from '@/services/auth-service';
import type {
  CreatePersonalVoiceInput,
  VoiceMessage,
  VoiceMessageRow,
} from '@/types';

const voiceBucket = 'voice-messages';

function mapVoiceRow(row: VoiceMessageRow, uri: string): VoiceMessage {
  if (row.type !== 'personal') {
    throw new Error(`Unsupported remote voice type: ${row.type}`);
  }

  return {
    id: row.id,
    senderId: row.sender_id,
    receiverId: row.receiver_id,
    morningRequestId: row.morning_request_id,
    uri,
    storagePath: row.storage_path,
    durationMs: row.duration_ms,
    type: 'personal',
    createdAt: row.created_at,
  };
}

export class SupabaseVoiceRepository implements VoiceRepository {
  async createPersonal(input: CreatePersonalVoiceInput): Promise<VoiceMessage> {
    const authenticatedUserId = authService.getAuthenticatedUserId();
    if (input.senderId !== authenticatedUserId) {
      throw new Error('Voice sender does not match the authenticated user');
    }

    const voiceId = Crypto.randomUUID();
    const storagePath = `personal/${input.receiverId}/${authenticatedUserId}/${voiceId}.m4a`;
    const file = new File(input.uri);
    if (!file.exists) {
      throw new Error('The local recording file does not exist');
    }

    const audioData = await file.arrayBuffer();
    if (audioData.byteLength === 0) {
      throw new Error('The local recording file is empty');
    }

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
      const { data, error } = await supabase
        .rpc('send_personal_voice', {
          p_voice_id: voiceId,
          p_receiver_id: input.receiverId,
          p_morning_request_id: input.morningRequestId,
          p_sender_morning_request_id: input.senderMorningRequestId,
          p_storage_path: storagePath,
          p_duration_ms: input.durationMs,
        })
        .single();

      if (error) throw error;
      return mapVoiceRow(data, input.uri);
    } catch (error) {
      const { error: cleanupError } = await supabase.storage
        .from(voiceBucket)
        .remove([storagePath]);
      if (cleanupError) {
        logDevelopmentError('voice.upload.cleanup', cleanupError);
      }
      throw error;
    }
  }
}
