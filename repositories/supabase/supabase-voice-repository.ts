import * as Crypto from 'expo-crypto';

import { readLocalAudioData } from '@/features/voice/read-local-audio-data';
import { logDevelopmentError } from '@/lib/development-logger';
import { getSupabaseClient } from '@/lib/supabase';
import type { VoiceRepository } from '@/repositories/interfaces/voice-repository';
import { authService } from '@/services/auth-service';
import {
  voiceSafetyService,
  VoiceSafetyRejectedError,
  VoiceSafetyUnavailableError,
} from '@/services/voice-safety-service';
import type {
  CreatePersonalVoiceInput,
  VoiceMessage,
  VoiceMessageRow,
} from '@/types';

const voiceBucket = 'voice-messages';

function mapVoiceRow(
  row: VoiceMessageRow,
  uri: string
): VoiceMessage {
  if (row.type !== 'personal') {
    throw new Error(
      `Unsupported remote voice type: ${row.type}`
    );
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
    moderationStatus: row.moderation_status as VoiceMessage['moderationStatus'],
    moderationCategory: row.moderation_category as VoiceMessage['moderationCategory'],
    moderationReason: row.moderation_reason,
    moderatedAt: row.moderated_at,
    createdAt: row.created_at,
    alarmReceivedAt: row.alarm_received_at ?? undefined,
  };
}

export class SupabaseVoiceRepository
  implements VoiceRepository
{
  async createPersonal(
    input: CreatePersonalVoiceInput
  ): Promise<VoiceMessage> {
    const authenticatedUserId =
      authService.getAuthenticatedUserId();

    if (
      input.senderId !== authenticatedUserId
    ) {
      throw new Error(
        'Voice sender does not match the authenticated user'
      );
    }

    const voiceId = Crypto.randomUUID();

    const storagePath =
      `personal/${input.receiverId}/` +
      `${authenticatedUserId}/${voiceId}.m4a`;

    const audioData =
      await readLocalAudioData(input.uri);

    const supabase =
      getSupabaseClient();

    const { error: uploadError } =
      await supabase.storage
        .from(voiceBucket)
        .upload(storagePath, audioData, {
          cacheControl: '3600',
          contentType: 'audio/m4a',
          upsert: false,
        });

    if (uploadError) {
      throw uploadError;
    }

    try {
      try {
        await voiceSafetyService.assertVoiceIsSafe({
          bucket: voiceBucket,
          path: storagePath,
          voiceKind: 'personal',
          durationMs: input.durationMs,
        });
      } catch (safetyError) {
        if (!(safetyError instanceof VoiceSafetyUnavailableError)) {
          throw safetyError;
        }
        // The check itself is unavailable (e.g. the Gemini API is
        // rate-limited), not a genuine content rejection -- fail open so a
        // provider outage doesn't block every Personal Voice send. A real
        // rejection still throws VoiceSafetyRejectedError above.
        logDevelopmentError('voice.safetyCheck.unavailable', safetyError);
      }

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

      if (error) {
        throw error;
      }

      return mapVoiceRow(data, input.uri);
    } catch (error) {
      const { error: cleanupError } =
        await supabase.storage
          .from(voiceBucket)
          .remove([storagePath]);

      if (cleanupError) {
        logDevelopmentError(
          'voice.upload.cleanup',
          cleanupError
        );
      }
      if (error instanceof VoiceSafetyRejectedError) {
        throw error;
      }
      throw error;
    }
  }

  async getAlarmReceivedAt(voiceMessageId: string): Promise<string | null> {
    const { data, error } = await getSupabaseClient()
      .from('voice_messages')
      .select('alarm_received_at')
      .eq('id', voiceMessageId)
      .eq('type', 'personal')
      .maybeSingle();

    if (error) throw error;
    return data?.alarm_received_at ?? null;
  }

  async acknowledgeAlarmReceived(
    voiceMessageId: string,
    morningRequestId: string
  ): Promise<string> {
    const { data, error } = await getSupabaseClient().rpc(
      'acknowledge_personal_voice_alarm',
      {
        p_voice_id: voiceMessageId,
        p_morning_request_id: morningRequestId,
      }
    );

    if (error) throw error;
    return data;
  }
}
