import { moodOptions, scheduleOptions, voiceStyleOptions } from '@/constants/options';
import { logDevelopmentError } from '@/lib/development-logger';
import { getSupabaseClient } from '@/lib/supabase';
import type { MorningRequestRepository } from '@/repositories/interfaces/morning-request-repository';
import { authService } from '@/services/auth-service';
import type {
  MoodType,
  CreateMorningRequestInput,
  MorningRequest,
  MorningRequestRow,
  MorningRequestStatus,
  ScheduleType,
  VoiceStyle,
} from '@/types';

const morningRequestColumns =
  'id,user_id,wake_at,schedules,mood,preferred_voice_style,personal_eligible,voice_count,status,created_at,updated_at' as const;

const requestStatuses: MorningRequestStatus[] = [
  'draft',
  'open',
  'voice_assigned',
  'completed',
];

function isSchedule(value: string): value is ScheduleType {
  return (
    scheduleOptions.some((option) => option === value) ||
    (value.startsWith('その他：') && value.slice('その他：'.length).trim().length > 0)
  );
}

function isMood(value: string): value is MoodType {
  return moodOptions.some((option) => option === value);
}

function isVoiceStyle(value: string): value is VoiceStyle {
  return voiceStyleOptions.some((option) => option === value);
}

function isRequestStatus(value: string): value is MorningRequestStatus {
  return requestStatuses.some((status) => status === value);
}

function toNextMorningIso(wakeAt: string): string {
  const [hours, minutes] = wakeAt.split(':').map(Number);
  const nextMorning = new Date();
  nextMorning.setDate(nextMorning.getDate() + 1);
  nextMorning.setHours(hours, minutes, 0, 0);
  return nextMorning.toISOString();
}

function toWakeTime(timestamp: string): string {
  const wakeAt = new Date(timestamp);
  return `${String(wakeAt.getHours()).padStart(2, '0')}:${String(
    wakeAt.getMinutes()
  ).padStart(2, '0')}`;
}

function mapMorningRequestRow(row: MorningRequestRow): MorningRequest {
  const schedules = row.schedules.filter(isSchedule);

  if (
    schedules.length === 0 ||
    !isMood(row.mood) ||
    !isVoiceStyle(row.preferred_voice_style) ||
    !isRequestStatus(row.status)
  ) {
    throw new Error(`Invalid morning request data: ${row.id}`);
  }

  return {
    id: row.id,
    userId: row.user_id,
    wakeAt: toWakeTime(row.wake_at),
    schedules,
    mood: row.mood,
    preferredVoiceStyle: row.preferred_voice_style,
    personalEligible: row.personal_eligible,
    status: row.status,
    voiceCount: row.voice_count,
    createdAt: row.created_at,
  };
}

function tryMapMorningRequestRow(row: MorningRequestRow): MorningRequest | null {
  try {
    return mapMorningRequestRow(row);
  } catch (error) {
    logDevelopmentError('morningRequest.mapRow', error);
    return null;
  }
}

function isMorningRequest(request: MorningRequest | null): request is MorningRequest {
  return request !== null;
}

export class SupabaseMorningRequestRepository
  implements MorningRequestRepository
{
  async create(request: MorningRequest): Promise<MorningRequest> {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('morning_requests')
      .insert({
        id: request.id,
        user_id: request.userId,
        wake_at: toNextMorningIso(request.wakeAt),
        schedules: request.schedules,
        mood: request.mood,
        preferred_voice_style: request.preferredVoiceStyle,
        personal_eligible: false,
        voice_count: 0,
        status: 'open',
        created_at: request.createdAt,
        updated_at: request.createdAt,
      })
      .select(morningRequestColumns)
      .single();

    if (error) throw error;
    return mapMorningRequestRow(data);
  }

  async update(
    id: string,
    input: CreateMorningRequestInput
  ): Promise<MorningRequest | null> {
    const userId = authService.getAuthenticatedUserId();
    const now = new Date().toISOString();
    const { data, error } = await getSupabaseClient()
      .from('morning_requests')
      .update({
        wake_at: toNextMorningIso(input.wakeAt),
        schedules: input.schedules,
        mood: input.mood,
        preferred_voice_style: input.preferredVoiceStyle,
        updated_at: now,
      })
      .eq('id', id)
      .eq('user_id', userId)
      .select(morningRequestColumns)
      .maybeSingle();

    if (error) throw error;
    return data ? mapMorningRequestRow(data) : null;
  }

  async getAvailableRequests(userId: string): Promise<MorningRequest[]> {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('morning_requests')
      .select(morningRequestColumns)
      .eq('status', 'open')
      .neq('user_id', userId)
      .order('voice_count', { ascending: true })
      .order('created_at', { ascending: false })
      .limit(24);

    if (error) throw error;
    return data.map(tryMapMorningRequestRow).filter(isMorningRequest);
  }

  async getById(id: string): Promise<MorningRequest | null> {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('morning_requests')
      .select(morningRequestColumns)
      .eq('id', id)
      .maybeSingle();

    if (error) throw error;
    return data ? mapMorningRequestRow(data) : null;
  }

  async incrementVoiceCount(): Promise<MorningRequest | null> {
    throw new Error('Supabase voice counts are updated by send_personal_voice');
  }

  async markPersonalEligible(id: string): Promise<MorningRequest | null> {
    return this.updateOwnRequest(id, {
      personal_eligible: true,
      updated_at: new Date().toISOString(),
    });
  }

  async markCommunityReady(id: string): Promise<MorningRequest | null> {
    return this.updateOwnRequest(
      id,
      {
        personal_eligible: false,
        status: 'voice_assigned',
        updated_at: new Date().toISOString(),
      },
      true
    );
  }

  async reset(): Promise<void> {
    const userId = authService.getAuthenticatedUserId();
    const { error } = await getSupabaseClient()
      .from('morning_requests')
      .delete()
      .eq('user_id', userId);

    if (error) throw error;
  }

  private async updateOwnRequest(
    id: string,
    values: {
      personal_eligible: boolean;
      status?: MorningRequestStatus;
      updated_at: string;
    },
    requireNotEligible = false
  ): Promise<MorningRequest | null> {
    const userId = authService.getAuthenticatedUserId();
    let query = getSupabaseClient()
      .from('morning_requests')
      .update(values)
      .eq('id', id)
      .eq('user_id', userId);

    if (requireNotEligible) {
      query = query.eq('personal_eligible', false);
    }

    const { data, error } = await query
      .select(morningRequestColumns)
      .maybeSingle();

    if (error) throw error;
    return data ? mapMorningRequestRow(data) : null;
  }
}
