import type {
  SendThanksInput,
  ThanksMessage,
  VoiceMessage,
} from '@/types';

export interface ThanksRepository {
  send(input: SendThanksInput): Promise<ThanksMessage[]>;
  getForUser(userId: string): Promise<ThanksMessage[]>;
  createIncomingForGives(
    givenVoices: VoiceMessage[],
    receiverId: string
  ): Promise<ThanksMessage[]>;
}
