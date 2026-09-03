import { Platform } from 'react-native';

/**
 * The web build is the judge-facing demo: it has no Supabase session, and its
 * MediaRecorder output cannot be uploaded through expo-file-system, so every
 * flow runs on local mock data instead.
 */
export const isDemoMode = Platform.OS === 'web';
