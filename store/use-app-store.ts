import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

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
  givenVoiceMessages: VoiceMessage[];
  assignedWakeVoice: VoiceMessage | null;
  wakeSession: WakeSession | null;
  thanksMessages: ThanksMessage[];
  friendships: Friendship[];
};

type AppStore = PersistedAppState & {
  isHydrated: boolean;
  setHydrated: (isHydrated: boolean) => void;
  setProfile: (profile: UserProfile) => void;
  setMorningWakeTime: (wakeAt: string) => void;
  setMorningRequest: (request: MorningRequest) => void;
  selectGiveRequest: (requestId: string) => void;
  completeGive: (voiceMessage: VoiceMessage) => void;
  chooseCommunityWake: () => void;
  startWakeSession: () => void;
  completeMission: () => void;
  addThanks: (message: ThanksMessage) => void;
  resetPrototype: () => void;
};

const initialPersistedState: PersistedAppState = {
  currentUser: null,
  morningRequestDraft: null,
  currentMorningRequest: null,
  selectedGiveRequestId: null,
  givenVoiceMessages: [],
  assignedWakeVoice: null,
  wakeSession: null,
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
      setMorningWakeTime: (wakeAt) => set({ morningRequestDraft: { wakeAt } }),
      setMorningRequest: (request) =>
        set({
          morningRequestDraft: { wakeAt: request.wakeAt },
          currentMorningRequest: request,
          selectedGiveRequestId: null,
          assignedWakeVoice: null,
          wakeSession: null,
        }),
      selectGiveRequest: (requestId) => set({ selectedGiveRequestId: requestId }),
      completeGive: (voiceMessage) => {
        const { currentMorningRequest, currentUser } = get();
        if (!currentMorningRequest || !currentUser) return;

        const eligibleRequest: MorningRequest = {
          ...currentMorningRequest,
          personalEligible: true,
          status: 'voice_assigned',
        };

        set((state) => ({
          currentMorningRequest: eligibleRequest,
          selectedGiveRequestId: null,
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
      startWakeSession: () => {
        const { assignedWakeVoice, currentMorningRequest, currentUser } = get();
        if (!assignedWakeVoice || !currentMorningRequest || !currentUser) return;

        set({
          wakeSession: {
            id: `wake-session-${Date.now()}`,
            userId: currentUser.id,
            morningRequestId: currentMorningRequest.id,
            voiceMessageId: assignedWakeVoice.id,
            alarmAt: currentMorningRequest.wakeAt,
            missionCompleted: false,
            status: 'ringing',
          },
        });
      },
      completeMission: () => {
        const wakeSession = get().wakeSession;
        if (!wakeSession) return;

        set({
          wakeSession: {
            ...wakeSession,
            missionCompleted: true,
            status: 'completed',
            wokeAt: new Date().toISOString(),
          },
        });
      },
      addThanks: (message) =>
        set((state) => ({ thanksMessages: [message, ...state.thanksMessages] })),
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
        givenVoiceMessages: state.givenVoiceMessages,
        assignedWakeVoice: state.assignedWakeVoice,
        wakeSession: state.wakeSession,
        thanksMessages: state.thanksMessages,
        friendships: state.friendships,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHydrated(true);
      },
    }
  )
);
