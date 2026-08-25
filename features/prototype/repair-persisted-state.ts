import { prototypeConfig } from '@/constants/config';
import { mockPersonalWakeVoice } from '@/data/mock-voices';
import { bindWakeVoice } from '@/features/wake/bind-wake-voice';
import { createDemoWokeAt } from '@/features/wake/create-demo-woke-at';
import type {
  MorningRequest,
  PrototypePersistedState,
  VoiceMessage,
  WakeSession,
} from '@/types';

export function getPrototypeStateRepair(
  state: PrototypePersistedState
): Partial<PrototypePersistedState> {
  if (!state.currentUser) {
    return {
      currentUser: null,
      morningRequestDraft: null,
      currentMorningRequest: null,
      selectedGiveRequestId: null,
      currentGiveReceiverIds: [],
      givenVoiceMessages: [],
      assignedWakeVoice: null,
      wakeSession: null,
      wakeMissionProgress: 0,
      thanksMessages: [],
      friendships: [],
    };
  }

  const request = state.currentMorningRequest;
  if (!request) {
    return {
      selectedGiveRequestId: null,
      currentGiveReceiverIds: [],
      assignedWakeVoice: null,
      wakeSession: null,
      wakeMissionProgress: 0,
    };
  }

  if (request.userId !== state.currentUser.id && request.userId !== 'current-user') {
    return {
      morningRequestDraft: null,
      currentMorningRequest: null,
      selectedGiveRequestId: null,
      currentGiveReceiverIds: [],
      assignedWakeVoice: null,
      wakeSession: null,
      wakeMissionProgress: 0,
    };
  }

  const normalizedRequest: MorningRequest =
    request.userId === 'current-user'
      ? { ...request, userId: state.currentUser.id }
      : request;

  const assignedVoice = state.assignedWakeVoice;
  if (!assignedVoice) {
    const restoredPersonalVoice = normalizedRequest.personalEligible
      ? bindWakeVoice(mockPersonalWakeVoice, normalizedRequest.id, state.currentUser.id)
      : null;
    return {
      currentMorningRequest: normalizedRequest,
      assignedWakeVoice: restoredPersonalVoice,
      wakeSession: null,
      wakeMissionProgress: 0,
    };
  }

  const compatibleAssignedVoice =
    assignedVoice.type === 'personal' && assignedVoice.uri.startsWith('mock://personal/')
      ? bindWakeVoice(
          mockPersonalWakeVoice,
          assignedVoice.morningRequestId ?? normalizedRequest.id,
          assignedVoice.receiverId ?? state.currentUser.id
        )
      : assignedVoice;
  const normalizedVoice: VoiceMessage = {
    ...compatibleAssignedVoice,
    receiverId:
      !compatibleAssignedVoice.receiverId ||
      compatibleAssignedVoice.receiverId === 'current-user'
        ? state.currentUser.id
        : compatibleAssignedVoice.receiverId,
    morningRequestId: compatibleAssignedVoice.morningRequestId ?? normalizedRequest.id,
  };
  const voiceIsValid =
    normalizedVoice.receiverId === state.currentUser.id &&
    normalizedVoice.morningRequestId === normalizedRequest.id &&
    (normalizedVoice.type === 'community' || normalizedRequest.personalEligible);

  if (!voiceIsValid) {
    return {
      currentMorningRequest: normalizedRequest,
      assignedWakeVoice: null,
      wakeSession: null,
      wakeMissionProgress: 0,
    };
  }

  const persistedSession = state.wakeSession;
  if (!persistedSession) {
    return {
      currentMorningRequest: normalizedRequest,
      assignedWakeVoice: normalizedVoice,
      wakeMissionProgress: 0,
    };
  }
  const session: WakeSession =
    persistedSession.userId === 'current-user'
      ? { ...persistedSession, userId: state.currentUser.id }
      : persistedSession;

  const sessionIsValid =
    session.userId === state.currentUser.id &&
    session.morningRequestId === normalizedRequest.id &&
    session.voiceMessageId === normalizedVoice.id;
  if (!sessionIsValid) {
    return {
      currentMorningRequest: normalizedRequest,
      assignedWakeVoice: normalizedVoice,
      wakeSession: null,
      wakeMissionProgress: 0,
    };
  }

  const progress =
    session.status === 'mission' || session.status === 'completed'
      ? Math.min(prototypeConfig.wakeMissionSteps, Math.max(0, state.wakeMissionProgress))
      : 0;
  const normalizedSession: WakeSession =
    session.status === 'completed'
      ? {
          ...session,
          missionCompleted: true,
          wokeAt: session.wokeAt ?? createDemoWokeAt(session.alarmAt),
        }
      : session;

  return {
    currentMorningRequest: normalizedRequest,
    assignedWakeVoice: normalizedVoice,
    wakeSession: normalizedSession,
    wakeMissionProgress:
      normalizedSession.status === 'completed'
        ? prototypeConfig.wakeMissionSteps
        : progress,
  };
}
