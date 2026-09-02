import { avatarOptions } from '@/constants/options';
import { isWakeStyle } from '@/constants/community-voice';
import { checkCommunityVoiceSafety } from '@/features/community-voice/check-community-voice-safety';
import { logDevelopmentError } from '@/lib/development-logger';
import { getSupabaseClient } from '@/lib/supabase';
import type { CommunityVoiceRepository } from '@/repositories/interfaces/community-voice-repository';
import { authService } from '@/services/auth-service';
import type {
  AvatarId,
  CommunityVoice,
  CommunityVoiceRow,
  CommunityVoiceStats,
  CreateCommunityVoiceInput,
  VoiceMessage,
  WakeStyle,
} from '@/types';
import * as Crypto from 'expo-crypto';
import { File } from 'expo-file-system';

const communityVoiceBucket = 'community-voices';
const signedUrlLifetimeSeconds = 15 * 60;
const communityVoiceColumns =
  'id,sender_id,audio_path,duration_ms,wake_style,moderation_status,play_count,thanks_count,created_at' as const;

function isAvatarId(value: string): value is AvatarId {
  return avatarOptions.some((option) => option.id === value);
}

function mapCommunityVoiceRow(row: CommunityVoiceRow, uri: string): CommunityVoice {
  if (!isWakeStyle(row.wake_style)) {
    throw new Error(`Invalid community voice wake style: ${row.wake_style}`);
  }

  return {
    id: row.id,
    senderId: row.sender_id,
    audioPath: row.audio_path,
    uri,
    durationMs: row.duration_ms,
    wakeStyle: row.wake_style,
    moderationStatus:
      row.moderation_status === 'pending' ||
      row.moderation_status === 'approved' ||
      row.moderation_status === 'rejected'
        ? row.moderation_status
        : 'pending',
    playCount: row.play_count,
    thanksCount: row.thanks_count,
    createdAt: row.created_at,
  };
}

export function mapCommunityVoiceToWakeVoice(
  voice: CommunityVoice,
  receiverId: string,
  morningRequestId: string,
  deliveryId: string
): VoiceMessage {
  return {
    id: voice.id,
    senderId: voice.senderId,
    receiverId,
    morningRequestId,
    deliveryId,
    uri: voice.uri,
    storagePath: voice.audioPath,
    durationMs: voice.durationMs,
    type: 'community',
    wakeStyle: voice.wakeStyle,
    createdAt: voice.createdAt,
  };
}

export class SupabaseCommunityVoiceRepository
  implements CommunityVoiceRepository
{
  async create(input: CreateCommunityVoiceInput): Promise<CommunityVoice> {
    const authenticatedUserId = authService.getAuthenticatedUserId();
    if (input.senderId !== authenticatedUserId) {
      throw new Error('Community voice sender does not match the authenticated user');
    }

    const voiceId = Crypto.randomUUID();
    const audioPath = `${authenticatedUserId}/${voiceId}.m4a`;
    const file = new File(input.uri);
    if (!file.exists) {
      throw new Error('The local recording file does not exist');
    }

    const audioData = await file.arrayBuffer();
    if (audioData.byteLength === 0) {
      throw new Error('The local recording file is empty');
    }

    const moderationStatus = await checkCommunityVoiceSafety(input);
    const supabase = getSupabaseClient();
    const { error: uploadError } = await supabase.storage
      .from(communityVoiceBucket)
      .upload(audioPath, audioData, {
        cacheControl: '3600',
        contentType: 'audio/mp4',
        upsert: false,
      });

    if (uploadError) throw uploadError;

    try {
      const { data, error } = await supabase
        .rpc('create_community_voice', {
          p_voice_id: voiceId,
          p_audio_path: audioPath,
          p_duration_ms: input.durationMs,
          p_wake_style: input.wakeStyle,
          p_moderation_status: moderationStatus,
        })
        .single();

      if (error) throw error;
      return mapCommunityVoiceRow(data, input.uri);
    } catch (error) {
      const { error: cleanupError } = await supabase.storage
        .from(communityVoiceBucket)
        .remove([audioPath]);
      if (cleanupError) {
        logDevelopmentError('communityVoice.upload.cleanup', cleanupError);
      }
      throw error;
    }
  }

  async assignForWakeStyle(
    wakeStyle: WakeStyle,
    receiverId: string
  ): Promise<{ voice: CommunityVoice; deliveryId: string } | null> {
    const authenticatedUserId = authService.getAuthenticatedUserId();
    if (receiverId !== authenticatedUserId) {
      throw new Error('Community voice receiver does not match the authenticated user');
    }

    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .rpc('assign_community_voice', { p_wake_style: wakeStyle })
      .maybeSingle();

    if (error) throw error;
    if (!data) return null;

    const { data: signedUrl, error: signedUrlError } = await supabase.storage
      .from(communityVoiceBucket)
      .createSignedUrl(data.audio_path, signedUrlLifetimeSeconds);

    if (signedUrlError) throw signedUrlError;

    return {
      voice: mapCommunityVoiceRow(data, signedUrl.signedUrl),
      deliveryId: data.delivery_id,
    };
  }

  async markPlayed(deliveryId: string): Promise<void> {
    const { error } = await getSupabaseClient().rpc('mark_community_voice_played', {
      p_delivery_id: deliveryId,
    });
    if (error) throw error;
  }

  async sendThanks(voiceId: string, userId: string): Promise<void> {
    if (userId !== authService.getAuthenticatedUserId()) {
      throw new Error('Community voice thanks user does not match the authenticated user');
    }
    const { error } = await getSupabaseClient().rpc('thank_community_voice', {
      p_voice_id: voiceId,
    });
    if (error) throw error;
  }

  async hasThanks(voiceId: string, userId: string): Promise<boolean> {
    const { data, error } = await getSupabaseClient()
      .from('community_voice_thanks')
      .select('id')
      .eq('voice_id', voiceId)
      .eq('user_id', userId)
      .maybeSingle();

    if (error) throw error;
    return data !== null;
  }

  async getStats(userId: string): Promise<CommunityVoiceStats> {
    const { data, error } = await getSupabaseClient()
      .from('community_voices')
      .select('play_count,thanks_count')
      .eq('sender_id', userId);

    if (error) throw error;

    return data.reduce<CommunityVoiceStats>(
      (stats, voice) => ({
        wakeCount: stats.wakeCount + voice.play_count,
        thanksCount: stats.thanksCount + voice.thanks_count,
      }),
      { wakeCount: 0, thanksCount: 0 }
    );
  }

  async listMine(userId: string): Promise<CommunityVoice[]> {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('community_voices')
      .select(communityVoiceColumns)
      .eq('sender_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return Promise.all(
      data.map(async (row) => {
        const { data: signedUrl, error: signedUrlError } = await supabase.storage
          .from(communityVoiceBucket)
          .createSignedUrl(row.audio_path, signedUrlLifetimeSeconds);

        if (signedUrlError) throw signedUrlError;
        return mapCommunityVoiceRow(row, signedUrl.signedUrl);
      })
    );
  }
}
