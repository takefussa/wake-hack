import type { ThanksRepository } from '@/repositories/interfaces/thanks-repository';
import { MockThanksRepository } from '@/repositories/mock/mock-thanks-repository';
import { morningRequestService } from '@/services/morning-request-service';
import { profileService } from '@/services/profile-service';
import type {
  SendThanksInput,
  ThanksInboxItem,
  ThanksMessage,
  VoiceMessage,
} from '@/types';

function formatFallbackContext(createdAt: string): string {
  const date = new Date(createdAt);
  if (Number.isNaN(date.getTime())) return '以前届けた声への返事';
  return `${date.getMonth() + 1}月${date.getDate()}日に届けた声への返事`;
}

export class ThanksService {
  constructor(private readonly repository: ThanksRepository) {}

  async send(input: SendThanksInput): Promise<ThanksMessage[]> {
    const reaction = input.reaction.trim();
    const text = input.text?.trim();
    if (!input.senderId || !input.receiverId || !input.sourceVoiceMessageId || !reaction) {
      throw new Error('Thanks input is incomplete');
    }

    const messages = [
      await this.repository.create({
        senderId: input.senderId,
        receiverId: input.receiverId,
        sourceVoiceMessageId: input.sourceVoiceMessageId,
        type: 'reaction',
        content: reaction,
      }),
    ];

    if (text) {
      messages.push(
        await this.repository.create({
          senderId: input.senderId,
          receiverId: input.receiverId,
          sourceVoiceMessageId: input.sourceVoiceMessageId,
          type: 'text',
          content: text,
        })
      );
    }

    return messages;
  }

  async createIncomingForGives(
    givenVoices: VoiceMessage[],
    receiverId: string
  ): Promise<ThanksMessage[]> {
    return this.repository.createIncomingForGives(givenVoices, receiverId);
  }

  async getInboxItems(
    messages: ThanksMessage[],
    givenVoices: VoiceMessage[],
    receiverId: string
  ): Promise<ThanksInboxItem[]> {
    const inbox = messages
      .filter(
        (message) =>
          message.receiverId === receiverId || message.receiverId === 'current-user'
      )
      .sort(
        (left, right) =>
          new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime()
      );

    return Promise.all(
      inbox.map(async (message) => {
        const sourceVoice = givenVoices.find(
          (voice) => voice.id === message.sourceVoiceMessageId
        );
        const request = sourceVoice?.morningRequestId
          ? await morningRequestService.getRequest(sourceVoice.morningRequestId)
          : null;

        return {
          message,
          sender: await profileService.getProfile(message.senderId),
          contextLabel: request
            ? `${request.schedules.join('・')}の朝へ届けた声への返事`
            : formatFallbackContext(message.createdAt),
        };
      })
    );
  }
}

export const thanksService = new ThanksService(new MockThanksRepository());
