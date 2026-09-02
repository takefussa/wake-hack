import { getNextWakeDate } from '@/features/morning/get-next-wake-date';
import { getSupabaseClient } from '@/lib/supabase';
import type {
  PersistedWakeSessionInput,
  WakeSessionRepository,
} from '@/repositories/interfaces/wake-session-repository';
import { authService } from '@/services/auth-service';
import type { WakeSession, WakeSessionRow, WakeSessionStatus } from '@/types';

const wakeSessionColumns =
  'id,user_id,morning_request_id,wake_assignment_id,wake_voice_key,alarm_at,woke_at,mission_completed,status,created_at,updated_at' as const;

function isWakeSessionStatus(value: string): value is WakeSessionStatus {
  return value === 'scheduled' || value === 'ringing' || value === 'completed';
}

function formatWakeTime(timestamp: string): string {
  const date = new Date(timestamp);
  return `${String(date.getHours()).padStart(2, '0')}:${String(
    date.getMinutes()
  ).padStart(2, '0')}`;
}

function getAlarmDate(session: PersistedWakeSessionInput): Date {
  if (session.scheduledFor) {
    const scheduledDate = new Date(session.scheduledFor);
    if (!Number.isNaN(scheduledDate.getTime())) return scheduledDate;
  }

  return getNextWakeDate(session.alarmAt);
}

function mapWakeSessionRow(row: WakeSessionRow): WakeSession {
  if (!isWakeSessionStatus(row.status)) {
    throw new Error(`Unsupported Wake session status: ${row.status}`);
  }

  return {
    id: row.id,
    userId: row.user_id,
    morningRequestId: row.morning_request_id,
    wakeAssignmentId: row.wake_assignment_id,
    voiceMessageId: row.wake_voice_key,
    alarmAt: formatWakeTime(row.alarm_at),
    scheduledFor: row.alarm_at,
    wokeAt: row.woke_at ?? undefined,
    missionCompleted: row.mission_completed,
    status: row.status,
  };
}

export class SupabaseWakeSessionRepository implements WakeSessionRepository {
  async findByMorningRequestId(
    morningRequestId: string
  ): Promise<WakeSession | null> {
    const userId = authService.getAuthenticatedUserId();
    const { data, error } = await getSupabaseClient()
      .from('wake_sessions')
      .select(wakeSessionColumns)
      .eq('morning_request_id', morningRequestId)
      .eq('user_id', userId)
      .maybeSingle();

    if (error) throw error;
    return data ? mapWakeSessionRow(data) : null;
  }

  async start(session: PersistedWakeSessionInput): Promise<WakeSession> {
    if (session.userId !== authService.getAuthenticatedUserId()) {
      throw new Error('Wake session user does not match the authenticated user');
    }

    const existingSession = await this.findByMorningRequestId(
      session.morningRequestId
    );
    if (existingSession?.status === 'completed') return existingSession;

    const now = new Date().toISOString();
    const { data, error } = await getSupabaseClient()
      .from('wake_sessions')
      .upsert(
        {
          user_id: session.userId,
          morning_request_id: session.morningRequestId,
          wake_assignment_id: session.wakeAssignmentId,
          wake_voice_key: session.voiceMessageId,
          alarm_at: getAlarmDate(session).toISOString(),
          woke_at: null,
          mission_completed: false,
          status: 'ringing',
          updated_at: now,
        },
        { onConflict: 'morning_request_id' }
      )
      .select(wakeSessionColumns)
      .single();

    if (error) {
      const racedSession = await this.findByMorningRequestId(
        session.morningRequestId
      );
      if (racedSession?.status === 'completed') return racedSession;
      throw error;
    }
    return mapWakeSessionRow(data);
  }

  async complete(sessionId: string, wokeAt: string): Promise<WakeSession> {
    const userId = authService.getAuthenticatedUserId();
    const { data, error } = await getSupabaseClient()
      .from('wake_sessions')
      .update({
        woke_at: wokeAt,
        mission_completed: true,
        status: 'completed',
        updated_at: wokeAt,
      })
      .eq('id', sessionId)
      .eq('user_id', userId)
      .select(wakeSessionColumns)
      .single();

    if (error) throw error;
    return mapWakeSessionRow(data);
  }

  async delete(sessionId: string): Promise<void> {
    const userId = authService.getAuthenticatedUserId();
    const { error } = await getSupabaseClient()
      .from('wake_sessions')
      .delete()
      .eq('id', sessionId)
      .eq('user_id', userId);

    if (error) throw error;
  }
}
