import type { VoiceMessage } from '@/types';

export function bindWakeVoice(
  voice: VoiceMessage,
  morningRequestId: string,
  receiverId: string
): VoiceMessage {
  return {
    ...voice,
    id: `${voice.id}-${morningRequestId}`,
    receiverId,
    morningRequestId,
  };
}
