import type { ThanksRepository } from '@/repositories/interfaces/thanks-repository';
import type {
  SendThanksInput,
  ThanksMessage,
  VoiceMessage,
} from '@/types';

const incomingCopy: Record<string, string> = {
  'user-takumi': '起きられました。発表、頑張ってきます。ありがとう！',
  'user-mio': '落ち着いて朝を始められました。声を届けてくれてありがとう。',
  'user-haruka': '朝から少し元気が出ました。今日も頑張れそうです。',
};

export class MockThanksRepository implements ThanksRepository {
  async send(input: SendThanksInput): Promise<ThanksMessage[]> {
    const createdAt = new Date().toISOString();
    const messages: ThanksMessage[] = [
      {
        id: `thanks-${Date.now()}-reaction-${input.receiverId}`,
        senderId: input.senderId,
        receiverId: input.receiverId,
        sourceVoiceMessageId: input.sourceVoiceMessageId,
        type: 'reaction',
        content: input.reaction,
        createdAt,
      },
    ];

    if (input.text) {
      messages.push({
        id: `thanks-${Date.now()}-text-${input.receiverId}`,
        senderId: input.senderId,
        receiverId: input.receiverId,
        sourceVoiceMessageId: input.sourceVoiceMessageId,
        type: 'text',
        content: input.text,
        createdAt,
      });
    }

    return messages;
  }

  async getForUser(): Promise<ThanksMessage[]> {
    return [];
  }

  async createIncomingForGives(
    givenVoices: VoiceMessage[],
    receiverId: string
  ): Promise<ThanksMessage[]> {
    const createdAt = Date.now();

    return givenVoices
      .filter(
        (voice): voice is VoiceMessage & { receiverId: string } =>
          voice.type === 'personal' &&
          voice.senderId === receiverId &&
          typeof voice.receiverId === 'string'
      )
      .map((voice, index) => ({
        id: `thanks-incoming-${voice.id}`,
        senderId: voice.receiverId,
        receiverId,
        sourceVoiceMessageId: voice.id,
        type: 'text' as const,
        content:
          incomingCopy[voice.receiverId] ??
          '声のおかげで朝を始められました。ありがとう。',
        createdAt: new Date(createdAt + index).toISOString(),
      }));
  }
}
