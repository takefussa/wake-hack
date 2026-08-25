import type { MorningRequest, UserProfile, VoiceMessage, WakeSession } from '@/types';

type WakeContext = {
  currentUser: UserProfile;
  morningRequest: MorningRequest;
  voice: VoiceMessage;
  wakeSession: WakeSession;
};

export function isWakeContextValid({
  currentUser,
  morningRequest,
  voice,
  wakeSession,
}: WakeContext): boolean {
  return (
    morningRequest.userId === currentUser.id &&
    voice.receiverId === currentUser.id &&
    voice.morningRequestId === morningRequest.id &&
    wakeSession.userId === currentUser.id &&
    wakeSession.morningRequestId === morningRequest.id &&
    wakeSession.voiceMessageId === voice.id
  );
}
