import { getSupabaseClient } from '@/lib/supabase';
import type { WakeVoiceRepository } from '@/repositories/interfaces/wake-voice-repository';
import type { MorningRequest, VoiceMessage, VoiceMessageRow } from '@/types';

const voiceBucket = 'voice-messages';
const signedUrlLifetimeSeconds = 15 * 60;
const recentAlarmVoiceLifetimeMs = 24 * 60 * 60 * 1_000;
const voiceColumns =
  'id,sender_id,receiver_id,morning_request_id,storage_path,duration_ms,type,created_at' as const;

function mapReceivedVoice(row: VoiceMessageRow, signedUrl: string): VoiceMessage {
  if (row.type !== 'personal') {
    throw new Error(`Unsupported remote voice type: ${row.type}`);
  }

  return {
    id: row.id,
    senderId: row.sender_id,
    receiverId: row.receiver_id,
    morningRequestId: row.morning_request_id,
    uri: signedUrl,
    storagePath: row.storage_path,
    durationMs: row.duration_ms,
    type: 'personal',
    createdAt: row.created_at,
  };
}

export class SupabaseWakeVoiceRepository implements WakeVoiceRepository {
  constructor(private readonly fallbackRepository: WakeVoiceRepository) {}

  async findPersonalById(
    voiceMessageId: string,
    request: MorningRequest,
    receiverId: string
  ): Promise<VoiceMessage | null> {
    const supabase = getSupabaseClient();
    const { data: voice, error } = await supabase
      .from('voice_messages')
      .select(voiceColumns)
      .eq('id', voiceMessageId)
      .eq('receiver_id', receiverId)
      .eq('morning_request_id', request.id)
      .eq('type', 'personal')
      .maybeSingle();

    if (error) throw error;
    return voice ? this.createPlayableVoice(voice) : null;
  }

  async findPersonalForRequest(
    request: MorningRequest,
    receiverId: string
  ): Promise<VoiceMessage | null> {
    const supabase = getSupabaseClient();
    const { data: voice, error } = await supabase
      .from('voice_messages')
      .select(voiceColumns)
      .eq('receiver_id', receiverId)
      .eq('morning_request_id', request.id)
      .eq('type', 'personal')
      .order('created_at', { ascending: true })
      .limit(1)
      .maybeSingle();

    if (error) throw error;
    if (!voice) return null;

    return this.createPlayableVoice(voice);
  }

  async findPersonalForAlarm(
    request: MorningRequest,
    receiverId: string
  ): Promise<VoiceMessage | null> {
    const exactVoice = await this.findPersonalForRequest(request, receiverId);
    if (exactVoice) return exactVoice;

    const createdAfter = new Date(
      Date.now() - recentAlarmVoiceLifetimeMs
    ).toISOString();
    const { data: voice, error } = await getSupabaseClient()
      .from('voice_messages')
      .select(voiceColumns)
      .eq('receiver_id', receiverId)
      .eq('type', 'personal')
      .gte('created_at', createdAfter)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) throw error;
    return voice ? this.createPlayableVoice(voice) : null;
  }

  private async createPlayableVoice(row: VoiceMessageRow): Promise<VoiceMessage> {
    const { data: signedUrl, error: signedUrlError } = await getSupabaseClient().storage
      .from(voiceBucket)
      .createSignedUrl(row.storage_path, signedUrlLifetimeSeconds);

    if (signedUrlError) throw signedUrlError;
    return mapReceivedVoice(row, signedUrl.signedUrl);
  }

  findCommunityForRequest(
    request: MorningRequest,
    receiverId: string
  ): Promise<VoiceMessage> {
    return this.fallbackRepository.findCommunityForRequest(request, receiverId);
  }
}
