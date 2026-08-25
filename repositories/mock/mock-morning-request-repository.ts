import { mockMorningRequests } from '@/data/mock-requests';
import type { MorningRequestRepository } from '@/repositories/interfaces/morning-request-repository';
import type { MorningRequest } from '@/types';

export class MockMorningRequestRepository implements MorningRequestRepository {
  async create(request: MorningRequest): Promise<MorningRequest> {
    return request;
  }

  async getAvailableRequests(userId: string): Promise<MorningRequest[]> {
    return mockMorningRequests.filter(
      (request) => request.userId !== userId && request.status === 'open'
    );
  }

  async getById(id: string): Promise<MorningRequest | null> {
    return mockMorningRequests.find((request) => request.id === id) ?? null;
  }
}
