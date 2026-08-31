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
    };
  }

  const persistedSession = state.wakeSession;
  if (!persistedSession) {
    return {
      currentMorningRequest: normalizedRequest,
      assignedWakeVoice: normalizedVoice,
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
    };
  }

  const hasLegacyMissionStatus = (session.status as string) === 'mission';
  const normalizedSession: WakeSession =
    session.status === 'completed'
      ? {
          ...session,
          wokeAt: session.wokeAt ?? createDemoWokeAt(session.alarmAt),
        }
      : hasLegacyMissionStatus
        ? { ...session, status: 'ringing' }
        : session;

  return {
    currentMorningRequest: normalizedRequest,
    assignedWakeVoice: normalizedVoice,
    wakeSession: normalizedSession,
  };
}
