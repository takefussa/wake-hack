import { MockMorningRequestRepository } from '@/repositories/mock/mock-morning-request-repository';
import type { MorningRequestRepository } from '@/repositories/interfaces/morning-request-repository';
import type { MorningRequest } from '@/types';

export class MorningRequestService {
  constructor(private readonly repository: MorningRequestRepository) {}

  async getAvailableRequests(userId: string): Promise<MorningRequest[]> {
    return this.repository.getAvailableRequests(userId);
  }

  async getRequest(id: string): Promise<MorningRequest | null> {
    return this.repository.getById(id);
  }
}

export const morningRequestService = new MorningRequestService(
  new MockMorningRequestRepository()
);
