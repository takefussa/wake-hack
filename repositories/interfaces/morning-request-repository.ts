import type { CreateMorningRequestInput, MorningRequest } from '@/types';

export interface MorningRequestRepository {
  create(request: MorningRequest): Promise<MorningRequest>;
  update(
    id: string,
    input: CreateMorningRequestInput
  ): Promise<MorningRequest | null>;
  getAvailableRequests(userId: string): Promise<MorningRequest[]>;
  getById(id: string): Promise<MorningRequest | null>;
  incrementVoiceCount(id: string): Promise<MorningRequest | null>;
  markPersonalEligible(id: string): Promise<MorningRequest | null>;
  markCommunityReady(id: string): Promise<MorningRequest | null>;
  reset(): Promise<void>;
}
