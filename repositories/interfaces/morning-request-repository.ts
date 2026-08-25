import type { MorningRequest } from '@/types';

export interface MorningRequestRepository {
  create(request: MorningRequest): Promise<MorningRequest>;
  getAvailableRequests(userId: string): Promise<MorningRequest[]>;
  getById(id: string): Promise<MorningRequest | null>;
  incrementVoiceCount(id: string): Promise<MorningRequest | null>;
}
