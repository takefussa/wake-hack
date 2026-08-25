import type {
  CreateThanksMessageInput,
  ThanksMessage,
  VoiceMessage,
} from '@/types';

export interface ThanksRepository {
  create(input: CreateThanksMessageInput): Promise<ThanksMessage>;
  createIncomingForGives(
    givenVoices: VoiceMessage[],
    receiverId: string
  ): Promise<ThanksMessage[]>;
}
