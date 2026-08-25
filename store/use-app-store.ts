import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { prototypeConfig } from '@/constants/config';
import { mockFriendships } from '@/data/mock-friends';
import { mockThanksMessages } from '@/data/mock-thanks';
import { mockCommunityVoices, mockPersonalWakeVoice } from '@/data/mock-voices';
import type {
  Friendship,
  MorningRequest,
  MorningRequestDraft,
  ThanksMessage,
  UserProfile,
  VoiceMessage,
  WakeSession,
} from '@/types';

type PersistedAppState = {
  currentUser: UserProfile | null;
  morningRequestDraft: MorningRequestDraft | null;
  currentMorningRequest: MorningRequest | null;
  selectedGiveRequestId: string | null;
  currentGiveReceiverIds: string[];
  givenVoiceMessages: VoiceMessage[];
  assignedWakeVoice: VoiceMessage | null;
  wakeSession: WakeSession | null;
  wakeMissionProgress: number;
  thanksMessages: ThanksMessage[];
  friendships: Friendship[];
};

type AppStore = PersistedAppState & {
  isHydrated: boolean;
  setHydrated: (isHydrated: boolean) => void;
  setProfile: (profile: UserProfile) => void;
  updateProfile: (profile: UserProfile) => boolean;
  setMorningWakeTime: (wakeAt: string) => void;
  setMorningRequest: (request: MorningRequest) => void;
  selectGiveRequest: (requestId: string) => void;
  completeGive: (voiceMessage: VoiceMessage) => void;
  chooseCommunityWake: () => void;
  startWakeSession: (voiceMessage: VoiceMessage) => boolean;
  cancelWakeSession: () => void;
  startWakeMission: () => void;
  advanceWakeMission: (steps: number) => void;
  completeMission: () => void;
  addThanks: (message: ThanksMessage) => void;
  addThanksMessages: (messages: ThanksMessage[]) => void;
  upsertFriendship: (friendship: Friendship) => void;
  resetPrototype: () => void;
};

const initialPersistedState: PersistedAppState = {
  currentUser: null,
  morningRequestDraft: null,
  currentMorningRequest: null,
  selectedGiveRequestId: null,
  currentGiveReceiverIds: [],
  givenVoiceMessages: [],
  assignedWakeVoice: null,
  wakeSession: null,
  wakeMissionProgress: 0,
  thanksMessages: mockThanksMessages,
  friendships: mockFriendships,
};

export const useAppStore = create<AppStore>()(
  persist(
    (set, get) => ({
      ...initialPersistedState,
      isHydrated: false,
      setHydrated: (isHydrated) => set({ isHydrated }),
      setProfile: (profile) => set({ currentUser: profile }),
      updateProfile: (profile) => {
        const currentUser = get().currentUser;
        if (!currentUser || currentUser.id !== profile.id) return false;

        set({ currentUser: profile });
        return true;
      },
      setMorningWakeTime: (wakeAt) => set({ morningRequestDraft: { wakeAt } }),
      setMorningRequest: (request) =>
        set({
          morningRequestDraft: { wakeAt: request.wakeAt },
          currentMorningRequest: request,
          selectedGiveRequestId: null,
          currentGiveReceiverIds: [],
          assignedWakeVoice: null,
          wakeSession: null,
          wakeMissionProgress: 0,
        }),
      selectGiveRequest: (requestId) => set({ selectedGiveRequestId: requestId }),
      completeGive: (voiceMessage) => {
        const { currentMorningRequest, currentUser } = get();
        if (
          !currentMorningRequest ||
          !currentUser ||
          voiceMessage.type !== 'personal' ||
          voiceMessage.senderId !== currentUser.id ||
          !voiceMessage.receiverId ||
          !voiceMessage.morningRequestId
        ) {
          return;
        }

        const receiverId = voiceMessage.receiverId;
        const eligibleRequest: MorningRequest = {
          ...currentMorningRequest,
          personalEligible: true,
          status: 'voice_assigned',
        };

        set((state) => ({
          currentMorningRequest: eligibleRequest,
          selectedGiveRequestId: null,
          currentGiveReceiverIds: Array.from(
            new Set([...state.currentGiveReceiverIds, receiverId])
          ),
          givenVoiceMessages: [...state.givenVoiceMessages, voiceMessage],
          assignedWakeVoice: {
            ...mockPersonalWakeVoice,
            receiverId: currentUser.id,
            morningRequestId: eligibleRequest.id,
          },
        }));
      },
      chooseCommunityWake: () => {
        const currentMorningRequest = get().currentMorningRequest;
        if (!currentMorningRequest) return;
        if (currentMorningRequest.personalEligible) return;

        set({
          currentMorningRequest: {
            ...currentMorningRequest,
            personalEligible: false,
            status: 'voice_assigned',
          },
          selectedGiveRequestId: null,
          assignedWakeVoice: mockCommunityVoices[0],
        });
      },
      startWakeSession: (voiceMessage) => {
        const { currentMorningRequest, currentUser } = get();
        if (
          !currentMorningRequest ||
          !currentUser ||
          voiceMessage.receiverId !== currentUser.id ||
          voiceMessage.morningRequestId !== currentMorningRequest.id ||
          (voiceMessage.type !== 'personal' && voiceMessage.type !== 'community')
        ) {
          return false;
        }

        set({
          assignedWakeVoice: voiceMessage,
          wakeSession: {
            id: `wake-session-${Date.now()}`,
            userId: currentUser.id,
            morningRequestId: currentMorningRequest.id,
            voiceMessageId: voiceMessage.id,
            alarmAt: currentMorningRequest.wakeAt,
            missionCompleted: false,
            status: 'ringing',
          },
          wakeMissionProgress: 0,
        });
        return true;
      },
      cancelWakeSession: () => {
        const wakeSession = get().wakeSession;
        if (!wakeSession || wakeSession.status !== 'ringing') return;

        set({
          wakeSession: null,
          wakeMissionProgress: 0,
        });
      },
      startWakeMission: () => {
        const wakeSession = get().wakeSession;
        if (!wakeSession || wakeSession.status !== 'ringing') return;

        set({
          wakeSession: {
            ...wakeSession,
            status: 'mission',
          },
        });
      },
      advanceWakeMission: (steps) => {
        const { wakeMissionProgress, wakeSession } = get();
        if (!wakeSession || wakeSession.status !== 'mission' || steps <= 0) return;

        set({
          wakeMissionProgress: Math.min(
            prototypeConfig.wakeMissionSteps,
            wakeMissionProgress + steps
          ),
        });
      },
      completeMission: () => {
        const { currentMorningRequest, wakeMissionProgress, wakeSession } = get();
        if (
          !wakeSession ||
          wakeSession.status !== 'mission' ||
          wakeMissionProgress < prototypeConfig.wakeMissionSteps
        ) {
          return;
        }

        set({
          wakeSession: {
            ...wakeSession,
            missionCompleted: true,
            status: 'completed',
            wokeAt: new Date().toISOString(),
          },
          currentMorningRequest: currentMorningRequest
            ? { ...currentMorningRequest, status: 'completed' }
            : null,
        });
      },
      addThanks: (message) =>
        set((state) => ({ thanksMessages: [message, ...state.thanksMessages] })),
      addThanksMessages: (messages) =>
        set((state) => {
          const existingIds = new Set(state.thanksMessages.map((message) => message.id));
          const uniqueMessages = messages.filter((message) => !existingIds.has(message.id));
          return { thanksMessages: [...uniqueMessages, ...state.thanksMessages] };
        }),
      upsertFriendship: (friendship) =>
        set((state) => {
          const normalizeUserId = (userId: string) =>
            userId === 'current-user' ? (state.currentUser?.id ?? userId) : userId;
          const incomingUserAId = normalizeUserId(friendship.userAId);
          const incomingUserBId = normalizeUserId(friendship.userBId);
          const existingIndex = state.friendships.findIndex(
            (candidate) => {
              const candidateUserAId = normalizeUserId(candidate.userAId);
              const candidateUserBId = normalizeUserId(candidate.userBId);
              return (
                candidate.id === friendship.id ||
                (candidateUserAId === incomingUserAId &&
                  candidateUserBId === incomingUserBId) ||
                (candidateUserAId === incomingUserBId &&
                  candidateUserBId === incomingUserAId)
              );
            }
          );
          if (existingIndex < 0) {
            return { friendships: [friendship, ...state.friendships] };
          }

          const existing = state.friendships[existingIndex];
          const nextFriendship =
            existing.status === 'matched' && friendship.status === 'pending'
              ? existing
              : {
                  ...friendship,
                  morningCount: Math.max(existing.morningCount, friendship.morningCount),
                  createdAt: existing.createdAt,
                };
          const friendships = [...state.friendships];
          friendships[existingIndex] = nextFriendship;
          return { friendships };
        }),
      resetPrototype: () =>
        set({
          ...initialPersistedState,
          isHydrated: true,
        }),
    }),
    {
      name: 'wake-hack-prototype-v01',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state): PersistedAppState => ({
        currentUser: state.currentUser,
        morningRequestDraft: state.morningRequestDraft,
        currentMorningRequest: state.currentMorningRequest,
        selectedGiveRequestId: state.selectedGiveRequestId,
        currentGiveReceiverIds: state.currentGiveReceiverIds,
        givenVoiceMessages: state.givenVoiceMessages,
        assignedWakeVoice: state.assignedWakeVoice,
        wakeSession: state.wakeSession,
        wakeMissionProgress: state.wakeMissionProgress,
        thanksMessages: state.thanksMessages,
        friendships: state.friendships,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHydrated(true);
      },
    }
  )
);
