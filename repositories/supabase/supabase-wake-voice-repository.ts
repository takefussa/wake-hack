import { getSupabaseClient } from '@/lib/supabase';
import type { WakeVoiceRepository } from '@/repositories/interfaces/wake-voice-repository';
import type {
  MorningRequest,
  VoiceMessage,
  VoiceMessageRow,
  VoiceStyle,
} from '@/types';

const voiceBucket = 'voice-messages';
const legacyCommunityVoiceBucket = 'community-voices';
const signedUrlLifetimeSeconds = 15 * 60;
const voiceColumns =
  'id,sender_id,receiver_id,morning_request_id,storage_path,duration_ms,type,created_at' as const;

type WakeVoiceRow = Omit<VoiceMessageRow, 'alarm_received_at'>;

function mapReceivedVoice(row: WakeVoiceRow, signedUrl: string): VoiceMessage {
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

function getString(row: Record<string, unknown>, ...keys: string[]): string | null {
  for (const key of keys) {
    const value = row[key];
    if (typeof value === 'string' && value.trim()) return value;
  }
  return null;
}

function getDuration(row: Record<string, unknown>): number {
  const value = row.duration_ms ?? row.duration;
  return typeof value === 'number' && value > 0 ? value : 5_000;
}

function toVoiceStyle(value: string | null): VoiceStyle | undefined {
  switch (value) {
    case 'gentle':
      return 'そっと優しく';
    case 'cheerful':
      return '明るく元気に';
    case 'strict':
      return '渇を入れて';
    case 'funny':
      return '面白く愉快に';
    default:
      return value as VoiceStyle | undefined;
  }
}

function mapCommunityVoice(
  row: Record<string, unknown>,
  uri: string
): VoiceMessage | null {
  const id = getString(row, 'id');
  const senderId = getString(row, 'sender_id', 'user_id', 'author_id');
  if (!id || !senderId) return null;

  return {
    id,
    senderId,
    uri,
    storagePath: getString(row, 'storage_path', 'audio_path', 'file_path', 'path') ?? undefined,
    durationMs: getDuration(row),
    type: 'community',
    voiceStyle: toVoiceStyle(getString(row, 'voice_style', 'wake_style', 'style', 'category')),
    createdAt: getString(row, 'created_at') ?? new Date(0).toISOString(),
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
      // A corrected recording supersedes an earlier recording for the same
      // wake request.
      .order('created_at', { ascending: false })
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
    // A voice belongs to one morning request. Once that alarm has fired, a
    // newly-created request must wait for a newly-recorded voice.
    return this.findPersonalForRequest(request, receiverId);
  }

  private async createPlayableVoice(row: WakeVoiceRow): Promise<VoiceMessage> {
    const { data: signedUrl, error: signedUrlError } = await getSupabaseClient().storage
      .from(voiceBucket)
      .createSignedUrl(row.storage_path, signedUrlLifetimeSeconds);

    if (signedUrlError) throw signedUrlError;
    return mapReceivedVoice(row, signedUrl.signedUrl);
  }

  async findCommunityForRequest(
    request: MorningRequest,
    receiverId: string
  ): Promise<VoiceMessage> {
    const supabase = getSupabaseClient();
    // Existing Supabase projects created before the merge have a
    // community_voices table with different column names. Read the row shape
    // first, rather than asking PostgREST for a column that may not exist.
    const { data, error } = await supabase
      .from('community_voices')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) throw error;
    const rows = (data ?? []) as unknown as Record<string, unknown>[];
    const matching = rows.find(
      (row) => getString(row, 'voice_style', 'style', 'category') === request.preferredVoiceStyle
    );
    const row = matching ?? rows[0];
    if (!row) return this.fallbackRepository.findCommunityForRequest(request, receiverId);

    const storagePath = getString(row, 'storage_path', 'audio_path', 'file_path', 'path');
    const directUri = getString(row, 'audio_url', 'voice_url', 'url', 'uri');
    let uri = directUri;
    if (storagePath) {
      // Migration 006 used community-voices/<uid>/<id>.m4a; migration 014
      // uses voice-messages/community/<uid>/<id>.wav. Select the matching
      // bucket and retry the other one for rows created during migration.
      const preferredBucket = storagePath.startsWith('community/')
        ? voiceBucket
        : legacyCommunityVoiceBucket;
      const buckets = [preferredBucket, preferredBucket === voiceBucket ? legacyCommunityVoiceBucket : voiceBucket];
      let lastError: unknown = null;
      for (const bucket of buckets) {
        const { data: signedUrl, error: signedUrlError } = await supabase.storage
          .from(bucket)
          .createSignedUrl(storagePath, signedUrlLifetimeSeconds);
        if (!signedUrlError && signedUrl) {
          uri = signedUrl.signedUrl;
          break;
        }
        lastError = signedUrlError;
      }
      if (!uri && lastError) throw lastError;
    }
    if (!uri) return this.fallbackRepository.findCommunityForRequest(request, receiverId);

    const voice = mapCommunityVoice(row, uri);
    if (!voice) return this.fallbackRepository.findCommunityForRequest(request, receiverId);
    return { ...voice, receiverId, morningRequestId: request.id };
  }
}
