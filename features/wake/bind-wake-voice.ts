import type { VoiceMessage } from '@/types';

export function bindWakeVoice(
  voice: VoiceMessage,
  morningRequestId: string,
  receiverId: string
): VoiceMessage {
  return {
    ...voice,
    sourceVoiceId: voice.sourceVoiceId ?? voice.id,
    id: `${voice.id}-${morningRequestId}`,
    receiverId,
    morningRequestId,
  };
}
