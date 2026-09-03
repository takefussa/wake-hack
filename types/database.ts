export type ProfileRow = {
  id: string;
  nickname: string;
  avatar_id: string;
  bio: string | null;
  profile_image_path: string | null;
  user_type: string;
  tags: string[];
  created_at: string;
  updated_at: string;
};

export type MorningRequestRow = {
  id: string;
  user_id: string;
  wake_at: string;
  schedules: string[];
  mood: string;
  preferred_voice_style: string;
  voice_request_note: string | null;
  personal_eligible: boolean;
  voice_count: number;
  status: string;
  created_at: string;
  updated_at: string;
};

export type VoiceMessageRow = {
  id: string;
  sender_id: string;
  receiver_id: string;
  morning_request_id: string;
  storage_path: string;
  duration_ms: number;
  type: string;
  moderation_status: string;
  moderation_category: string | null;
  moderation_reason: string | null;
  moderated_at: string | null;
  created_at: string;
  alarm_received_at: string | null;
};

export type ThanksMessageRow = {
  id: string;
  sender_id: string;
  receiver_id: string;
  source_voice_message_id: string;
  reaction: string;
  text_message: string | null;
  created_at: string;
};

export type FriendshipRow = {
  id: string;
  user_a_id: string;
  user_b_id: string;
  user_a_requested: boolean;
  user_b_requested: boolean;
  status: string;
  morning_count: number;
  created_at: string;
  updated_at: string;
};

export type WakeAssignmentRow = {
  id: string;
  morning_request_id: string;
  voice_message_id: string | null;
  type: string;
  community_voice_id: string | null;
  assigned_at: string;
};

export type WakeSessionRow = {
  id: string;
  user_id: string;
  morning_request_id: string;
  wake_assignment_id: string;
  wake_voice_key: string;
  alarm_at: string;
  woke_at: string | null;
  mission_completed: boolean;
  status: string;
  created_at: string;
  updated_at: string;
};

export type CommunityVoiceRow = {
  id: string;
  sender_id: string;
  audio_path: string;
  duration_ms: number;
  wake_style: string;
  moderation_status: string;
  moderation_category: string | null;
  moderation_reason: string | null;
  moderated_at: string | null;
  play_count: number;
  thanks_count: number;
  created_at: string;
};

export type CommunityVoiceThanksRow = {
  id: string;
  voice_id: string;
  user_id: string;
  created_at: string;
};

export type CommunityVoiceDeliveryRow = {
  id: string;
  voice_id: string;
  receiver_id: string;
  delivered_at: string;
  played_at: string | null;
};

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: ProfileRow;
        Insert: {
          id: string;
          nickname: string;
          avatar_id: string;
          bio?: string | null;
          profile_image_path?: string | null;
          user_type: string;
          tags: string[];
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          nickname?: string;
          avatar_id?: string;
          bio?: string | null;
          profile_image_path?: string | null;
          user_type?: string;
          tags?: string[];
          updated_at?: string;
        };
        Relationships: [];
      };
      morning_requests: {
        Row: MorningRequestRow;
        Insert: {
          id?: string;
          user_id: string;
          wake_at: string;
          schedules: string[];
          mood: string;
          preferred_voice_style: string;
          voice_request_note?: string | null;
          personal_eligible?: boolean;
          voice_count?: number;
          status?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          wake_at?: string;
          schedules?: string[];
          mood?: string;
          preferred_voice_style?: string;
          voice_request_note?: string | null;
          personal_eligible?: boolean;
          voice_count?: number;
          status?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      voice_messages: {
        Row: VoiceMessageRow;
        Insert: {
          id: string;
          sender_id: string;
          receiver_id: string;
          morning_request_id: string;
          storage_path: string;
          duration_ms: number;
          type?: string;
          moderation_status?: string;
          moderation_category?: string | null;
          moderation_reason?: string | null;
          moderated_at?: string | null;
          created_at?: string;
          alarm_received_at?: string | null;
        };
        Update: {
          storage_path?: string;
          moderation_status?: string;
          moderation_category?: string | null;
          moderation_reason?: string | null;
          moderated_at?: string | null;
          alarm_received_at?: string | null;
        };
        Relationships: [];
      };
      community_voices: {
        Row: CommunityVoiceRow;
        Insert: {
          id: string;
          sender_id: string;
          audio_path: string;
          duration_ms: number;
          wake_style: string;
          moderation_status?: string;
          moderation_category?: string | null;
          moderation_reason?: string | null;
          moderated_at?: string | null;
          play_count?: number;
          thanks_count?: number;
          created_at?: string;
        };
        Update: {
          audio_path?: string;
          duration_ms?: number;
          wake_style?: string;
          moderation_status?: string;
          moderation_category?: string | null;
          moderation_reason?: string | null;
          moderated_at?: string | null;
          play_count?: number;
          thanks_count?: number;
        };
        Relationships: [];
      };
      community_voice_thanks: {
        Row: CommunityVoiceThanksRow;
        Insert: {
          id?: string;
          voice_id: string;
          user_id: string;
          created_at?: string;
        };
        Update: Record<string, never>;
        Relationships: [];
      };
      thanks_messages: {
        Row: ThanksMessageRow;
        Insert: {
          id?: string;
          sender_id: string;
          receiver_id: string;
          source_voice_message_id: string;
          reaction: string;
          text_message?: string | null;
          created_at?: string;
        };
        Update: Record<string, never>;
        Relationships: [];
      };
      community_voice_deliveries: {
        Row: CommunityVoiceDeliveryRow;
        Insert: {
          id?: string;
          voice_id: string;
          receiver_id: string;
          delivered_at?: string;
          played_at?: string | null;
        };
        Update: {
          delivered_at?: string;
          played_at?: string | null;
        };
        Relationships: [];
      };
      friendships: {
        Row: FriendshipRow;
        Insert: {
          id?: string;
          user_a_id: string;
          user_b_id: string;
          user_a_requested?: boolean;
          user_b_requested?: boolean;
          status?: string;
          morning_count?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: Record<string, never>;
        Relationships: [];
      };
      wake_assignments: {
        Row: WakeAssignmentRow;
        Insert: {
          id?: string;
          morning_request_id: string;
          voice_message_id?: string | null;
          type: string;
          community_voice_id?: string | null;
          assigned_at?: string;
        };
        Update: Record<string, never>;
        Relationships: [];
      };
      wake_sessions: {
        Row: WakeSessionRow;
        Insert: {
          id?: string;
          user_id: string;
          morning_request_id: string;
          wake_assignment_id: string;
          wake_voice_key: string;
          alarm_at: string;
          woke_at?: string | null;
          mission_completed?: boolean;
          status?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          woke_at?: string | null;
          mission_completed?: boolean;
          status?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      send_personal_voice: {
        Args: {
          p_voice_id: string;
          p_receiver_id: string;
          p_morning_request_id: string;
          p_sender_morning_request_id: string;
          p_storage_path: string;
          p_duration_ms: number;
        };
        Returns: VoiceMessageRow[];
      };
      create_community_voice: {
        Args: {
          p_voice_id: string;
          p_audio_path: string;
          p_duration_ms: number;
          p_wake_style: string;
          p_moderation_status: string;
        };
        Returns: CommunityVoiceRow[];
      };
      assign_community_voice: {
        Args: {
          p_wake_style: string;
        };
        Returns: (CommunityVoiceRow & { delivery_id: string })[];
      };
      mark_community_voice_played: {
        Args: {
          p_delivery_id: string;
        };
        Returns: undefined;
      };
      update_community_voice_moderation: {
        Args: {
          p_voice_id: string;
          p_moderation_status: string;
          p_moderation_category?: string | null;
          p_moderation_reason?: string | null;
        };
        Returns: CommunityVoiceRow[];
      };
      thank_community_voice: {
        Args: {
          p_voice_id: string;
        };
        Returns: undefined;
      };
      request_friendship: {
        Args: {
          p_other_user_id: string;
          p_source_voice_message_id: string;
        };
        Returns: FriendshipRow[];
      };
      respond_to_friendship: {
        Args: {
          p_friendship_id: string;
        };
        Returns: FriendshipRow[];
      };
      assign_wake_voice: {
        Args: {
          p_morning_request_id: string;
        };
        Returns: WakeAssignmentRow[];
      };
      acknowledge_personal_voice_alarm: {
        Args: {
          p_voice_id: string;
          p_morning_request_id: string;
        };
        Returns: string;
      };
    };
  };
};
