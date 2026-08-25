import { useCallback, useEffect, useState } from 'react';

import { logDevelopmentError } from '@/lib/development-logger';
import { authService } from '@/services/auth-service';
import { profileService } from '@/services/profile-service';
import { useAppStore } from '@/store/use-app-store';
import type { UserProfile } from '@/types';

export type AuthBootstrapStatus = 'loading' | 'ready' | 'error';
export type AuthBootstrapFailure =
  | 'anonymous_disabled'
  | 'database_not_ready'
  | 'configuration'
  | 'network'
  | 'unknown';

function readErrorCode(error: unknown): string | null {
  if (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    typeof error.code === 'string'
  ) {
    return error.code;
  }
  return null;
}

function readErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return '';
}

function classifyBootstrapFailure(error: unknown): AuthBootstrapFailure {
  const code = readErrorCode(error);
  const message = readErrorMessage(error).toLowerCase();

  if (code === 'anonymous_provider_disabled') return 'anonymous_disabled';
  if (
    code === '42501' ||
    code === '42P01' ||
    message.includes('permission denied') ||
    message.includes('relation')
  ) {
    return 'database_not_ready';
  }
  if (message.includes('environment variables')) return 'configuration';
  if (
    message.includes('network request failed') ||
    message.includes('failed to fetch') ||
    message.includes('fetch failed')
  ) {
    return 'network';
  }
  return 'unknown';
}

export function useAuthBootstrap() {
  const isHydrated = useAppStore((state) => state.isHydrated);
  const restoreAuthenticatedProfile = useAppStore(
    (state) => state.restoreAuthenticatedProfile
  );
  const setAuthenticatedUserId = useAppStore(
    (state) => state.setAuthenticatedUserId
  );
  const [status, setStatus] = useState<AuthBootstrapStatus>('loading');
  const [failure, setFailure] = useState<AuthBootstrapFailure | null>(null);
  const [attempt, setAttempt] = useState(0);

  const retry = useCallback(() => {
    setStatus('loading');
    setFailure(null);
    setAttempt((current) => current + 1);
  }, []);

  useEffect(() => {
    if (!isHydrated) return;

    let isActive = true;
    let stopAutoRefresh: () => void = () => undefined;

    async function bootstrap() {
      setStatus('loading');
      setFailure(null);

      try {
        stopAutoRefresh = authService.startSessionAutoRefresh();
        const user = await authService.initializeAnonymousSession();
        let profile: UserProfile | null;
        try {
          profile = await profileService.getCurrentProfile(user.id);
        } catch (error) {
          const cachedProfile = useAppStore.getState().currentUser;
          if (
            classifyBootstrapFailure(error) !== 'network' ||
            cachedProfile?.id !== user.id
          ) {
            throw error;
          }
          profile = cachedProfile;
        }
        if (!isActive) return;

        setAuthenticatedUserId(user.id);
        restoreAuthenticatedProfile(profile);
        setStatus('ready');
      } catch (error) {
        if (!isActive) return;
        logDevelopmentError('bootstrap', error);
        setFailure(classifyBootstrapFailure(error));
        setStatus('error');
      }
    }

    void bootstrap();
    return () => {
      isActive = false;
      stopAutoRefresh();
    };
  }, [
    attempt,
    isHydrated,
    restoreAuthenticatedProfile,
    setAuthenticatedUserId,
  ]);

  return { status, failure, retry };
}
