import { MockMorningRequestRepository } from '@/repositories/mock/mock-morning-request-repository';
import type { MorningRequestRepository } from '@/repositories/interfaces/morning-request-repository';
import type { CreateMorningRequestInput, MorningRequest } from '@/types';

export class MorningRequestService {
  constructor(private readonly repository: MorningRequestRepository) {}

  async createRequest(
    userId: string,
    input: CreateMorningRequestInput
  ): Promise<MorningRequest> {
    return this.repository.create({
      id: `request-${Date.now()}`,
      userId,
      ...input,
      personalEligible: false,
      status: 'open',
      voiceCount: 0,
      createdAt: new Date().toISOString(),
    });
  }

  async getAvailableRequests(userId: string): Promise<MorningRequest[]> {
    return this.repository.getAvailableRequests(userId);
  }

  async getRequest(id: string): Promise<MorningRequest | null> {
    return this.repository.getById(id);
  }

  async markVoiceDelivered(id: string): Promise<MorningRequest> {
    const request = await this.repository.incrementVoiceCount(id);
    if (!request) {
      throw new Error('Morning request not found');
    }
    return request;
  }

  async resetPrototypeData(): Promise<void> {
    await this.repository.reset();
  }
}

export const morningRequestService = new MorningRequestService(
  new MockMorningRequestRepository()
);
