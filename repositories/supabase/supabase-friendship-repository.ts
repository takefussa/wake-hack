import { getSupabaseClient } from '@/lib/supabase';
import type { FriendshipRepository } from '@/repositories/interfaces/friendship-repository';
import { authService } from '@/services/auth-service';
import type { Friendship, FriendshipRow, RequestFriendshipInput } from '@/types';

const friendshipColumns =
  'id,user_a_id,user_b_id,user_a_requested,user_b_requested,status,morning_count,created_at,updated_at' as const;

function mapFriendshipRow(row: FriendshipRow): Friendship {
  if (row.status !== 'pending' && row.status !== 'matched') {
    throw new Error(`Unsupported friendship status: ${row.status}`);
  }

  return {
    id: row.id,
    userAId: row.user_a_id,
    userBId: row.user_b_id,
    userARequested: row.user_a_requested,
    userBRequested: row.user_b_requested,
    status: row.status,
    morningCount: row.morning_count,
    createdAt: row.created_at,
  };
}

export class SupabaseFriendshipRepository implements FriendshipRepository {
  async request(input: RequestFriendshipInput): Promise<Friendship> {
    if (input.requesterId !== authService.getAuthenticatedUserId()) {
      throw new Error('Friendship requester does not match the authenticated user');
    }

    const { data, error } = await getSupabaseClient()
      .rpc('request_friendship', {
        p_other_user_id: input.otherUserId,
        p_source_voice_message_id: input.sourceVoiceMessageId,
      })
      .single();

    if (error) throw error;
    return mapFriendshipRow(data);
  }

  async getForUser(userId: string): Promise<Friendship[]> {
    if (userId !== authService.getAuthenticatedUserId()) {
      throw new Error('Friendship user does not match the authenticated user');
    }

    const { data, error } = await getSupabaseClient()
      .from('friendships')
      .select(friendshipColumns)
      .or(`user_a_id.eq.${userId},user_b_id.eq.${userId}`)
      .order('updated_at', { ascending: false });

    if (error) throw error;
    return data.map(mapFriendshipRow);
  }

  async respond(friendshipId: string): Promise<Friendship> {
    const { data, error } = await getSupabaseClient()
      .rpc('respond_to_friendship', {
        p_friendship_id: friendshipId,
      })
      .single();

    if (error) throw error;
    return mapFriendshipRow(data);
  }
}
