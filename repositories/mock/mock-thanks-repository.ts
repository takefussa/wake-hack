import type { ThanksRepository } from '@/repositories/interfaces/thanks-repository';
import type {
  CreateThanksMessageInput,
  ThanksMessage,
  VoiceMessage,
} from '@/types';

const incomingCopy: Record<string, string> = {
  'user-takumi': '起きられました。発表、頑張ってきます。ありがとう！',
  'user-mio': '落ち着いて朝を始められました。声を届けてくれてありがとう。',
  'user-haruka': '朝から少し元気が出ました。今日も頑張れそうです。',
};

export class MockThanksRepository implements ThanksRepository {
  async create(input: CreateThanksMessageInput): Promise<ThanksMessage> {
    return {
      ...input,
      id: `thanks-${Date.now()}-${input.type}-${input.receiverId}`,
      createdAt: new Date().toISOString(),
    };
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
