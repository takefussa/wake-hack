import { getSupabaseClient } from '@/lib/supabase';
import type { ThanksRepository } from '@/repositories/interfaces/thanks-repository';
import { authService } from '@/services/auth-service';
import type {
  SendThanksInput,
  ThanksMessage,
  ThanksMessageRow,
  VoiceMessage,
} from '@/types';

const thanksColumns =
  'id,sender_id,receiver_id,source_voice_message_id,reaction,text_message,created_at' as const;

function mapThanksRow(row: ThanksMessageRow): ThanksMessage[] {
  const messages: ThanksMessage[] = [
    {
      id: `${row.id}:reaction`,
      senderId: row.sender_id,
      receiverId: row.receiver_id,
      sourceVoiceMessageId: row.source_voice_message_id,
      type: 'reaction',
      content: row.reaction,
      createdAt: row.created_at,
    },
  ];

  if (row.text_message) {
    messages.push({
      id: `${row.id}:text`,
      senderId: row.sender_id,
      receiverId: row.receiver_id,
      sourceVoiceMessageId: row.source_voice_message_id,
      type: 'text',
      content: row.text_message,
      createdAt: row.created_at,
    });
  }

  return messages;
}

function isUniqueViolation(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    error.code === '23505'
  );
}

export class SupabaseThanksRepository implements ThanksRepository {
  async send(input: SendThanksInput): Promise<ThanksMessage[]> {
    const authenticatedUserId = authService.getAuthenticatedUserId();
    if (input.senderId !== authenticatedUserId) {
      throw new Error('Thanks sender does not match the authenticated user');
    }

    const supabase = getSupabaseClient();
    const values = {
      sender_id: input.senderId,
      receiver_id: input.receiverId,
      source_voice_message_id: input.sourceVoiceMessageId,
      reaction: input.reaction,
      text_message: input.text ?? null,
    };
    const { data, error } = await supabase
      .from('thanks_messages')
      .insert(values)
      .select(thanksColumns)
      .single();

    if (!error) return mapThanksRow(data);
    if (!isUniqueViolation(error)) throw error;

    const { data: existing, error: existingError } = await supabase
      .from('thanks_messages')
      .select(thanksColumns)
      .eq('source_voice_message_id', input.sourceVoiceMessageId)
      .maybeSingle();

    if (existingError) throw existingError;
    if (!existing) throw error;
    return mapThanksRow(existing);
  }

  async getForUser(userId: string): Promise<ThanksMessage[]> {
    if (userId !== authService.getAuthenticatedUserId()) {
      throw new Error('Thanks user does not match the authenticated user');
    }

    const { data, error } = await getSupabaseClient()
      .from('thanks_messages')
      .select(thanksColumns)
      .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data.flatMap(mapThanksRow);
  }

  async createIncomingForGives(
    _givenVoices: VoiceMessage[],
    _receiverId: string
  ): Promise<ThanksMessage[]> {
    return [];
  }
}
