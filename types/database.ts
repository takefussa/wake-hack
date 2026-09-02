export type ProfileRow = {
  id: string;
  nickname: string;
  avatar_id: string;
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
  created_at: string;
};

export type CommunityVoiceRow = {
  id: string;
  sender_id: string;
  audio_path: string;
  duration_ms: number;
  wake_style: string;
  moderation_status: string;
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
          user_type: string;
          tags: string[];
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          nickname?: string;
          avatar_id?: string;
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
          created_at?: string;
        };
        Update: {
          storage_path?: string;
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
          play_count?: number;
          thanks_count?: number;
          created_at?: string;
        };
        Update: {
          audio_path?: string;
          duration_ms?: number;
          wake_style?: string;
          moderation_status?: string;
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
      thank_community_voice: {
        Args: {
          p_voice_id: string;
        };
        Returns: undefined;
      };
    };
  };
};
