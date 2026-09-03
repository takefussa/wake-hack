import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Crypto from 'expo-crypto';
import type {
  AppStateStatus,
  NativeEventSubscription,
} from 'react-native';
import { AppState, Platform } from 'react-native';

import { isDemoMode } from '@/features/demo/demo-mode';
import { logDevelopmentError } from '@/lib/development-logger';
import { getSupabaseClient } from '@/lib/supabase';

export type AuthenticatedUser = { id: string };

const demoUserStorageKey = '@wake-hack/demo-user-id';

function isNetworkError(error: unknown): boolean {
  const message = error instanceof Error ? error.message.toLowerCase() : '';
  return (
    message.includes('network request failed') ||
    message.includes('failed to fetch') ||
    message.includes('fetch failed')
  );
}

export class AuthService {
  private initializationPromise: Promise<AuthenticatedUser> | null = null;
  private authenticatedUserId: string | null = null;
  private appStateSubscription: NativeEventSubscription | null = null;

  initializeSession(): Promise<AuthenticatedUser> {
    if (!this.initializationPromise) {
      const session = isDemoMode
        ? this.resolveDemoSession()
        : this.resolveAnonymousSession();
      this.initializationPromise = session.catch((error) => {
        this.initializationPromise = null;
        this.authenticatedUserId = null;
        logDevelopmentError('auth.initialize', error);
        throw error;
      });
    }

    return this.initializationPromise;
  }

  getAuthenticatedUserId(): string {
    if (!this.authenticatedUserId) {
      throw new Error('Supabase Auth has not been initialized');
    }
    return this.authenticatedUserId;
  }

  getAuthenticatedUserIdOrNull(): string | null {
    return this.authenticatedUserId;
  }

  startSessionAutoRefresh(): () => void {
    if (Platform.OS === 'web' || this.appStateSubscription) {
      return () => undefined;
    }

    const supabase = getSupabaseClient();
    const updateRefreshState = (state: AppStateStatus) => {
      if (state === 'active') {
        supabase.auth.startAutoRefresh();
      } else {
        supabase.auth.stopAutoRefresh();
      }
    };

    updateRefreshState(AppState.currentState);
    this.appStateSubscription = AppState.addEventListener(
      'change',
      updateRefreshState
    );

    return () => {
      this.appStateSubscription?.remove();
      this.appStateSubscription = null;
      supabase.auth.stopAutoRefresh();
    };
  }

  private async resolveDemoSession(): Promise<AuthenticatedUser> {
    const storedUserId = await AsyncStorage.getItem(demoUserStorageKey);
    if (storedUserId) {
      this.authenticatedUserId = storedUserId;
      return { id: storedUserId };
    }

    // Deliberately not a UUID: every service routes non-UUID ids to its local
    // mock repository, which is what keeps the demo off Supabase entirely.
    const demoUserId = `demo-user-${Crypto.randomUUID()}`;
    await AsyncStorage.setItem(demoUserStorageKey, demoUserId);
    this.authenticatedUserId = demoUserId;
    return { id: demoUserId };
  }

  private async resolveAnonymousSession(): Promise<AuthenticatedUser> {
    const supabase = getSupabaseClient();
    const { data: sessionData, error: sessionError } =
      await supabase.auth.getSession();

    if (sessionError) throw sessionError;

    if (sessionData.session) {
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError) {
        if (!isNetworkError(userError)) throw userError;
        logDevelopmentError('auth.getUser.cachedSession', userError);
        this.authenticatedUserId = sessionData.session.user.id;
        return sessionData.session.user;
      }
      if (!userData.user) throw new Error('Stored Supabase session has no user');

      this.authenticatedUserId = userData.user.id;
      return userData.user;
    }

    const { data, error } = await supabase.auth.signInAnonymously();
    if (error) throw error;
    if (!data.user || !data.session) {
      throw new Error('Anonymous sign-in did not return a session');
    }

    this.authenticatedUserId = data.user.id;
    return data.user;
  }
}

export const authService = new AuthService();
