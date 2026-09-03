import { getSupabaseClient } from '@/lib/supabase';
import type { WakeAssignmentRepository } from '@/repositories/interfaces/wake-assignment-repository';
import type { WakeAssignment, WakeAssignmentRow, WakeAssignmentType } from '@/types';

function isWakeAssignmentType(value: string): value is WakeAssignmentType {
  return value === 'personal' || value === 'community';
}

function mapWakeAssignmentRow(row: WakeAssignmentRow): WakeAssignment {
  if (!isWakeAssignmentType(row.type)) {
    throw new Error(`Unsupported Wake assignment type: ${row.type}`);
  }
  if (row.type === 'personal' && !row.voice_message_id) {
    throw new Error('Personal Wake assignment has no voice message');
  }
  if (row.type === 'community' && !row.community_voice_id) {
    throw new Error('Community Wake assignment has no voice');
  }

  return {
    id: row.id,
    morningRequestId: row.morning_request_id,
    voiceMessageId: row.voice_message_id ?? undefined,
    communityVoiceId: row.community_voice_id ?? undefined,
    type: row.type,
    assignedAt: row.assigned_at,
  };
}

export class SupabaseWakeAssignmentRepository
  implements WakeAssignmentRepository
{
  async assign(morningRequestId: string): Promise<WakeAssignment> {
    const { data, error } = await getSupabaseClient()
      .rpc('assign_wake_voice', {
        p_morning_request_id: morningRequestId,
      })
      .single();

    if (error) throw error;
    return mapWakeAssignmentRow(data);
  }
}
