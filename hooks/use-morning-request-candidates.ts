import { useCallback, useEffect, useState } from 'react';

import { rankMorningRequests } from '@/services/matching-service';
import type { MorningRequestMatch } from '@/services/matching-service';
import { morningRequestService } from '@/services/morning-request-service';
import { profileService } from '@/services/profile-service';
import { useAppStore } from '@/store/use-app-store';
import type { UserProfile } from '@/types';

export type RequestCandidate = MorningRequestMatch & {
  user: UserProfile;
};

function isUserProfile(profile: UserProfile | null): profile is UserProfile {
  return profile !== null;
}

export function useMorningRequestCandidates() {
  const currentUser = useAppStore((state) => state.currentUser);
  const currentMorningRequest = useAppStore((state) => state.currentMorningRequest);
  const currentGiveReceiverIds = useAppStore((state) => state.currentGiveReceiverIds);
  const replaceMorningRequest = useAppStore((state) => state.replaceMorningRequest);
  const [candidates, setCandidates] = useState<RequestCandidate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    if (!currentUser || !currentMorningRequest) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const remoteCurrentRequest =
        await morningRequestService.ensureRemoteRequest(currentMorningRequest);
      if (remoteCurrentRequest.id !== currentMorningRequest.id) {
        replaceMorningRequest(remoteCurrentRequest);
        return;
      }

      const availableRequests = await morningRequestService.getAvailableRequests(
        currentUser.id,
        remoteCurrentRequest.id
      );
      const requests = availableRequests.filter(
        (request) => !currentGiveReceiverIds.includes(request.userId)
      );
      const profiles = (
        await Promise.all(requests.map((request) => profileService.getProfile(request.userId)))
      ).filter(isUserProfile);
      const matches = rankMorningRequests(currentUser, remoteCurrentRequest, requests, profiles);

      setCandidates(
        matches.flatMap((match) => {
          const user = profiles.find((profile) => profile.id === match.request.userId);
          return user ? [{ ...match, user }] : [];
        })
      );
    } catch {
      setError('朝リクエストを読み込めませんでした。');
    } finally {
      setIsLoading(false);
    }
  }, [currentGiveReceiverIds, currentMorningRequest, currentUser, replaceMorningRequest]);

  useEffect(() => {
    void reload();
  }, [reload]);

  return {
    candidates,
    isLoading,
    error,
    reload,
    hasMorningRequest: currentMorningRequest !== null,
  };
}
