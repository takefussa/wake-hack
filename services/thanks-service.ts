import { isSupabaseUuid } from '@/lib/identifiers';
import { logDevelopmentError } from '@/lib/development-logger';
import type { ThanksRepository } from '@/repositories/interfaces/thanks-repository';
import { MockThanksRepository } from '@/repositories/mock/mock-thanks-repository';
import { SupabaseThanksRepository } from '@/repositories/supabase/supabase-thanks-repository';
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
  constructor(
    private readonly repository: ThanksRepository,
    private readonly mockRepository: ThanksRepository
  ) {}

  async send(input: SendThanksInput): Promise<ThanksMessage[]> {
    const reaction = input.reaction.trim();
    const text = input.text?.trim();
    if (input.voiceUri && !input.voiceDurationMs) {
      throw new Error('Thanks voice duration is missing');
    }
    if (!input.senderId || !input.receiverId || !input.sourceVoiceMessageId || !reaction) {
      throw new Error('Thanks input is incomplete');
    }

    const repository =
      isSupabaseUuid(input.senderId) &&
      isSupabaseUuid(input.receiverId) &&
      isSupabaseUuid(input.sourceVoiceMessageId)
        ? this.repository
        : this.mockRepository;

    try {
      return await repository.send({
        ...input,
        reaction,
        text: text || undefined,
      });
    } catch (error) {
      logDevelopmentError('thanks.send', error);
      throw error;
    }
  }

  async createIncomingForGives(
    givenVoices: VoiceMessage[],
    receiverId: string
  ): Promise<ThanksMessage[]> {
    const mockGivenVoices = givenVoices.filter(
      (voice) =>
        !isSupabaseUuid(voice.id) ||
        !voice.receiverId ||
        !isSupabaseUuid(voice.receiverId)
    );
    return this.mockRepository.createIncomingForGives(mockGivenVoices, receiverId);
  }

  async getMessagesForUser(
    userId: string,
    localMessages: ThanksMessage[]
  ): Promise<ThanksMessage[]> {
    if (!isSupabaseUuid(userId)) return localMessages;

    try {
      const remoteMessages = await this.repository.getForUser(userId);
      const seenIds = new Set<string>();
      return [...remoteMessages, ...localMessages].filter((message) => {
        if (seenIds.has(message.id)) return false;
        seenIds.add(message.id);
        return true;
      });
    } catch (error) {
      logDevelopmentError('thanks.getForUser', error);
      throw error;
    }
  }

  async getInboxItems(
    messages: ThanksMessage[],
    givenVoices: VoiceMessage[],
    receiverId: string
  ): Promise<ThanksInboxItem[]> {
    const inboxMessages = messages
      .filter(
        (message) =>
          message.receiverId === receiverId || message.receiverId === 'current-user'
      );
    const groupedMessages = new Map<string, ThanksMessage[]>();
    inboxMessages.forEach((message) => {
      const key = `${message.senderId}:${message.sourceVoiceMessageId}`;
      const group = groupedMessages.get(key) ?? [];
      group.push(message);
      groupedMessages.set(key, group);
    });

    const inbox = Array.from(groupedMessages.values())
      .map((group) => {
        const reaction = group.find((message) => message.type === 'reaction');
        const text = group.find((message) => message.type === 'text');
        const voice = group.find((message) => message.type === 'voice');
        const primary = text ?? voice ?? reaction ?? group[0];
        const content = [reaction?.content, text?.content]
          .filter((value): value is string => Boolean(value))
          .filter((value, index, values) => values.indexOf(value) === index)
          .join('\n');
        return {
          ...primary,
          audioUri: voice?.audioUri,
          content: content || (voice ? '声のありがとう' : primary.content),
        };
      })
      .sort((left, right) => {
        return new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime();
      });

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

export const thanksService = new ThanksService(
  new SupabaseThanksRepository(),
  new MockThanksRepository()
);
