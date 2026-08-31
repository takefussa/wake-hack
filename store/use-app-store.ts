import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { mockCommunityVoices, mockPersonalWakeVoice } from '@/data/mock-voices';
import { getPrototypeStateRepair } from '@/features/prototype/repair-persisted-state';
import { bindWakeVoice } from '@/features/wake/bind-wake-voice';
import { createDemoWokeAt } from '@/features/wake/create-demo-woke-at';
import type {
  Friendship,
  MorningRequest,
  PrototypePersistedState,
  ThanksMessage,
  UserProfile,
  VoiceMessage,
} from '@/types';

type AppStore = PrototypePersistedState & {
  authUserId: string | null;
  isHydrated: boolean;
  setAuthenticatedUserId: (userId: string) => void;
  restoreAuthenticatedProfile: (profile: UserProfile | null) => void;
  setHydrated: (isHydrated: boolean) => void;
  setProfile: (profile: UserProfile) => boolean;
  updateProfile: (profile: UserProfile) => boolean;
  setMorningWakeTime: (wakeAt: string) => void;
  setMorningRequest: (request: MorningRequest) => void;
  replaceMorningRequest: (request: MorningRequest) => void;
  selectGiveRequest: (requestId: string) => void;
  completeGive: (voiceMessage: VoiceMessage) => boolean;
  chooseCommunityWake: () => void;
  startWakeSession: (voiceMessage: VoiceMessage) => boolean;
  cancelWakeSession: () => void;
  completeWakeSession: () => void;
  addThanks: (message: ThanksMessage) => void;
  addThanksMessages: (messages: ThanksMessage[]) => void;
  upsertFriendship: (friendship: Friendship) => void;
  repairPersistedState: () => void;
  resetPrototype: () => Promise<void>;
};

const prototypeStorageKey = 'wake-hack-prototype-v01';

const initialPersistedState: PrototypePersistedState = {
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

export const useAppStore = create<AppStore>()(
  persist(
    (set, get) => ({
      ...initialPersistedState,
      authUserId: null,
      isHydrated: false,
      setAuthenticatedUserId: (authUserId) => set({ authUserId }),
      restoreAuthenticatedProfile: (profile) =>
        set((state) => {
          if (!profile) {
            return { ...initialPersistedState };
          }

          const hasSameIdentity = state.currentUser?.id === profile.id;
          // Phase 1のDB列にない写真URIと一言コメントは、同じ端末のStoreから補完する。
          const restoredProfile: UserProfile = hasSameIdentity
            ? {
                ...profile,
                profileImageUri: state.currentUser?.profileImageUri,
                bio: state.currentUser?.bio,
              }
            : profile;

          if (!hasSameIdentity) {
            return {
              ...initialPersistedState,
              currentUser: restoredProfile,
            };
          }

          return { currentUser: restoredProfile };
        }),
      setHydrated: (isHydrated) => set({ isHydrated }),
      setProfile: (profile) => {
        if (profile.id !== get().authUserId) return false;

        set({ currentUser: profile });
        return true;
      },
      updateProfile: (profile) => {
        const { authUserId, currentUser } = get();
        if (
          !currentUser ||
          currentUser.id !== profile.id ||
          authUserId !== profile.id
        ) {
          return false;
        }

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
        }),
      replaceMorningRequest: (request) =>
        set((state) => {
          if (request.userId !== state.currentUser?.id) return {};

          return {
            morningRequestDraft: { wakeAt: request.wakeAt },
            currentMorningRequest: request,
            assignedWakeVoice: state.assignedWakeVoice
              ? {
                  ...state.assignedWakeVoice,
                  morningRequestId: request.id,
                }
              : null,
            wakeSession: null,
          };
        }),
      selectGiveRequest: (requestId) => set({ selectedGiveRequestId: requestId }),
      completeGive: (voiceMessage) => {
        const { currentGiveReceiverIds, currentMorningRequest, currentUser } = get();
        if (
          !currentMorningRequest ||
          !currentUser ||
          voiceMessage.type !== 'personal' ||
          voiceMessage.senderId !== currentUser.id ||
          !voiceMessage.receiverId ||
          !voiceMessage.morningRequestId ||
          currentGiveReceiverIds.includes(voiceMessage.receiverId)
        ) {
          return false;
        }

        const receiverId = voiceMessage.receiverId;
        const eligibleRequest: MorningRequest = {
          ...currentMorningRequest,
          personalEligible: true,
          status: voiceMessage.storagePath ? 'open' : 'voice_assigned',
        };

        set((state) => ({
          currentMorningRequest: eligibleRequest,
          selectedGiveRequestId: null,
          currentGiveReceiverIds: Array.from(
            new Set([...state.currentGiveReceiverIds, receiverId])
          ),
          givenVoiceMessages: [...state.givenVoiceMessages, voiceMessage],
          assignedWakeVoice: bindWakeVoice(
            mockPersonalWakeVoice,
            eligibleRequest.id,
            currentUser.id
          ),
        }));
        return true;
      },
      chooseCommunityWake: () => {
        const { currentMorningRequest, currentUser } = get();
        if (!currentMorningRequest || !currentUser) return;
        if (currentMorningRequest.personalEligible) return;

        const communityVoice = mockCommunityVoices[0];

        set({
          currentMorningRequest: {
            ...currentMorningRequest,
            personalEligible: false,
            status: 'voice_assigned',
          },
          selectedGiveRequestId: null,
          assignedWakeVoice: bindWakeVoice(
            communityVoice,
            currentMorningRequest.id,
            currentUser.id
          ),
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
            status: 'ringing',
          },
        });
        return true;
      },
      cancelWakeSession: () => {
        const wakeSession = get().wakeSession;
        if (!wakeSession || wakeSession.status === 'completed') return;

        set({
          wakeSession: null,
        });
      },
      completeWakeSession: () => {
        const { currentMorningRequest, wakeSession } = get();
        if (!wakeSession || wakeSession.status !== 'ringing') return;

        set({
          wakeSession: {
            ...wakeSession,
            status: 'completed',
            wokeAt: createDemoWokeAt(wakeSession.alarmAt),
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
      repairPersistedState: () => set((state) => getPrototypeStateRepair(state)),
      resetPrototype: async () => {
        try {
          await AsyncStorage.removeItem(prototypeStorageKey);
        } catch {
          // The clean in-memory state is persisted again by Zustand below.
        }
        set({
          ...initialPersistedState,
          isHydrated: true,
        });
      },
    }),
    {
      name: prototypeStorageKey,
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state): PrototypePersistedState => ({
        currentUser: state.currentUser,
        morningRequestDraft: state.morningRequestDraft,
        currentMorningRequest: state.currentMorningRequest,
        selectedGiveRequestId: state.selectedGiveRequestId,
        currentGiveReceiverIds: state.currentGiveReceiverIds,
        givenVoiceMessages: state.givenVoiceMessages,
        assignedWakeVoice: state.assignedWakeVoice,
        wakeSession: state.wakeSession,
        thanksMessages: state.thanksMessages,
        friendships: state.friendships,
      }),
      onRehydrateStorage: (state) => () => {
        state.repairPersistedState();
        state.setHydrated(true);
      },
    }
  )
);
