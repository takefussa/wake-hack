import type { MorningRequest } from '@/types';

export interface MorningRequestRepository {
  create(request: MorningRequest): Promise<MorningRequest>;
  getAvailableRequests(userId: string): Promise<MorningRequest[]>;
  getById(id: string): Promise<MorningRequest | null>;
  incrementVoiceCount(id: string): Promise<MorningRequest | null>;
  markPersonalEligible(id: string): Promise<MorningRequest | null>;
  markCommunityReady(id: string): Promise<MorningRequest | null>;
  reset(): Promise<void>;
}
