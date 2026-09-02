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
  WakeSession,
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
  addCommunityVoice: (voiceMessage: VoiceMessage) => void;
  chooseCommunityWake: () => void;
  startWakeSession: (voiceMessage: VoiceMessage, session?: WakeSession) => boolean;
  cancelWakeSession: () => WakeSession | null;
  completeWakeSession: () => WakeSession | null;
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
  communityVoiceMessages: [],
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
          const restoredProfile: UserProfile =
            hasSameIdentity &&
            profile.profileImagePath &&
            profile.profileImagePath === state.currentUser?.profileImagePath &&
            !profile.profileImageUri
              ? {
                  ...profile,
                  profileImageUri: state.currentUser.profileImageUri,
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
        const { currentMorningRequest, currentUser } = get();
        if (
          !currentMorningRequest ||
          !currentUser ||
          voiceMessage.type !== 'personal' ||
          voiceMessage.senderId !== currentUser.id ||
          !voiceMessage.receiverId ||
          !voiceMessage.morningRequestId
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
          // Keep the wake assignment unset until the receiver actually has a
          // valid wake voice ready. This prevents the app from showing a
          // wake-provider before the voice is genuinely assigned.
          assignedWakeVoice: state.assignedWakeVoice,
        }));
        return true;
      },
      addCommunityVoice: (voiceMessage) =>
        set((state) => ({
          communityVoiceMessages: [voiceMessage, ...state.communityVoiceMessages],
        })),
      chooseCommunityWake: () => {
        const { currentMorningRequest, currentUser, communityVoiceMessages } = get();
        if (!currentMorningRequest || !currentUser) return;
        if (currentMorningRequest.personalEligible) return;

        const localCommunityVoices = communityVoiceMessages
          .filter((voice) => voice.type === 'community')
          .sort(
            (left, right) =>
              new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime()
          );
        const communityVoice =
          localCommunityVoices.find(
            (voice) => voice.voiceStyle === currentMorningRequest.preferredVoiceStyle
          ) ?? localCommunityVoices[0] ?? mockCommunityVoices[0];

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
      startWakeSession: (voiceMessage, preparedSession) => {
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

        const session: WakeSession = preparedSession ?? {
          id: `wake-session-${Date.now()}`,
          userId: currentUser.id,
          morningRequestId: currentMorningRequest.id,
          voiceMessageId: voiceMessage.id,
          alarmAt: currentMorningRequest.wakeAt,
          scheduledFor: currentMorningRequest.scheduledFor,
          missionCompleted: false,
          isDemo: true,
          status: 'ringing',
        };
        if (
          session.userId !== currentUser.id ||
          session.morningRequestId !== currentMorningRequest.id ||
          session.voiceMessageId !== voiceMessage.id
        ) {
          return false;
        }

        set({
          assignedWakeVoice: voiceMessage,
          wakeSession: session,
          currentMorningRequest:
            session.status === 'completed'
              ? { ...currentMorningRequest, status: 'completed' }
              : currentMorningRequest,
        });
        return true;
      },
      cancelWakeSession: () => {
        const wakeSession = get().wakeSession;
        if (!wakeSession || wakeSession.status === 'completed') return null;

        set({
          wakeSession: null,
        });
        return wakeSession;
      },
      completeWakeSession: () => {
        const { currentMorningRequest, wakeSession } = get();
        if (!wakeSession || wakeSession.status !== 'ringing') return null;

        const completedSession: WakeSession = {
          ...wakeSession,
          status: 'completed',
          wokeAt: wakeSession.isDemo
            ? createDemoWokeAt(wakeSession.alarmAt)
            : new Date().toISOString(),
          missionCompleted: true,
        };

        set({
          wakeSession: completedSession,
          currentMorningRequest: currentMorningRequest
            ? { ...currentMorningRequest, status: 'completed' }
            : null,
        });
        return completedSession;
      },
      addThanks: (message) =>
        set((state) => ({ thanksMessages: [message, ...state.thanksMessages] })),
      addThanksMessages: (messages) =>
        set((state) => {
          const existingIds = new Set(state.thanksMessages.map((message) => message.id));
          const uniqueMessages = messages.filter((message) => !existingIds.has(message.id));
          if (uniqueMessages.length === 0) return state;
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
          if (
            existing.id === nextFriendship.id &&
            existing.userAId === nextFriendship.userAId &&
            existing.userBId === nextFriendship.userBId &&
            existing.userARequested === nextFriendship.userARequested &&
            existing.userBRequested === nextFriendship.userBRequested &&
            existing.status === nextFriendship.status &&
            existing.morningCount === nextFriendship.morningCount &&
            existing.createdAt === nextFriendship.createdAt
          ) {
            return state;
          }
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
        communityVoiceMessages: state.communityVoiceMessages,
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
