import type { MorningRequest, UserProfile } from '@/types';

export type MorningRequestMatch = {
  request: MorningRequest;
  score: number;
  commonPoints: string[];
};

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
  candidate: MorningRequest,
  candidateUser: UserProfile
): number {
  const hasSameSchedule = candidate.schedules.some((schedule) =>
    currentRequest.schedules.includes(schedule)
  );

  return (
    (candidate.voiceCount === 0 ? 100 : 0) +
    (hasSameSchedule ? 40 : 0) +
    (candidateUser.userType === currentUser.userType ? 25 : 0) +
    (candidate.preferredVoiceStyle === currentRequest.preferredVoiceStyle ? 15 : 0) +
    wakeTimeScore(candidate.wakeAt, currentRequest.wakeAt)
  );
}

function getCommonPoints(
  currentUser: UserProfile,
  currentRequest: MorningRequest,
  candidate: MorningRequest,
  candidateUser: UserProfile
): string[] {
  const points: string[] = [];
  const sharedSchedule = candidate.schedules.find((schedule) =>
    currentRequest.schedules.includes(schedule)
  );
  const timeDifference = Math.abs(
    timeToMinutes(candidate.wakeAt) - timeToMinutes(currentRequest.wakeAt)
  );

  if (candidateUser.userType === currentUser.userType) {
    points.push(currentUser.userType);
  }
  if (sharedSchedule && sharedSchedule !== '特にない') {
    points.push(`${sharedSchedule}の予定が同じ`);
  }
  if (candidate.preferredVoiceStyle === currentRequest.preferredVoiceStyle) {
    points.push('希望する声が近い');
  }
  if (timeDifference <= 30) {
    points.push('起床時間が近い');
  }

  return points.slice(0, 3);
}

export function rankMorningRequests(
  currentUser: UserProfile,
  currentRequest: MorningRequest,
  candidates: MorningRequest[],
  candidateUsers: UserProfile[]
): MorningRequestMatch[] {
  return candidates
    .filter((candidate) => candidate.userId !== currentUser.id)
    .flatMap((candidate) => {
      const candidateUser = candidateUsers.find((user) => user.id === candidate.userId);
      if (!candidateUser) return [];

      return [
        {
          request: candidate,
          score: scoreMorningRequest(currentUser, currentRequest, candidate, candidateUser),
          commonPoints: getCommonPoints(
            currentUser,
            currentRequest,
            candidate,
            candidateUser
          ),
        },
      ];
    })
    .sort((first, second) => second.score - first.score);
}
