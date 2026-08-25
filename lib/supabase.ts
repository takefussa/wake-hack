import 'react-native-url-polyfill/auto';

import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient, processLock } from '@supabase/supabase-js';
import type { SupabaseClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';

import type { Database } from '@/types';

let client: SupabaseClient<Database> | null = null;

export function getSupabaseClient(): SupabaseClient<Database> {
  if (client) return client;

  const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
  const supabasePublishableKey =
    process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!supabaseUrl || !supabasePublishableKey) {
    throw new Error('Supabase public environment variables are not configured');
  }

  client = createClient<Database>(supabaseUrl, supabasePublishableKey, {
    auth: {
      ...(Platform.OS !== 'web' ? { storage: AsyncStorage } : {}),
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
      lock: processLock,
    },
  });

  return client;
}
