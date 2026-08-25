import { getMockUserById } from '@/data/mock-users';
import type { MorningRequest, UserProfile } from '@/types';

function timeToMinutes(time: string): number {
  const [hours = 0, minutes = 0] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

function wakeTimeScore(first: string, second: string): number {
  const difference = Math.abs(timeToMinutes(first) - timeToMinutes(second));

  if (difference <= 15) return 15;
  if (difference <= 30) return 10;
  if (difference <= 60) return 5;
  return 0;
}

export function scoreMorningRequest(
  currentUser: UserProfile,
  currentRequest: MorningRequest,
  candidate: MorningRequest
): number {
  const candidateUser = getMockUserById(candidate.userId);
  const hasSameSchedule = candidate.schedules.some((schedule) =>
    currentRequest.schedules.includes(schedule)
  );

  return (
    (candidate.voiceCount === 0 ? 100 : 0) +
    (hasSameSchedule ? 40 : 0) +
    (candidateUser?.userType === currentUser.userType ? 25 : 0) +
    (candidate.preferredVoiceStyle === currentRequest.preferredVoiceStyle ? 15 : 0) +
    wakeTimeScore(candidate.wakeAt, currentRequest.wakeAt)
  );
}

export function rankMorningRequests(
  currentUser: UserProfile,
  currentRequest: MorningRequest,
  candidates: MorningRequest[]
): MorningRequest[] {
  return [...candidates]
    .filter((candidate) => candidate.userId !== currentUser.id)
    .sort(
      (first, second) =>
        scoreMorningRequest(currentUser, currentRequest, second) -
        scoreMorningRequest(currentUser, currentRequest, first)
    );
}
