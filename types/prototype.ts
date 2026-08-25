import type { Friendship } from './friendship';
import type { MorningRequest, MorningRequestDraft } from './morning';
import type { ThanksMessage } from './thanks';
import type { UserProfile } from './user';
import type { VoiceMessage } from './voice';
import type { WakeSession } from './wake';

export type PrototypePersistedState = {
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
