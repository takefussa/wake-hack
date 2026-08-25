import { mockMorningRequests } from '@/data/mock-requests';
import type { MorningRequestRepository } from '@/repositories/interfaces/morning-request-repository';
import type { MorningRequest } from '@/types';

export class MockMorningRequestRepository implements MorningRequestRepository {
  private requests = mockMorningRequests.map((request) => ({
    ...request,
    schedules: [...request.schedules],
  }));

  async create(request: MorningRequest): Promise<MorningRequest> {
    const existingIndex = this.requests.findIndex((item) => item.id === request.id);
    if (existingIndex >= 0) {
      this.requests[existingIndex] = request;
    } else {
      this.requests.push(request);
    }
    return { ...request, schedules: [...request.schedules] };
  }

  async getAvailableRequests(userId: string): Promise<MorningRequest[]> {
    return this.requests
      .filter((request) => request.userId !== userId && request.status === 'open')
      .map((request) => ({ ...request, schedules: [...request.schedules] }));
  }

  async getById(id: string): Promise<MorningRequest | null> {
    const request = this.requests.find((item) => item.id === id);
    return request ? { ...request, schedules: [...request.schedules] } : null;
  }

  async incrementVoiceCount(id: string): Promise<MorningRequest | null> {
    const requestIndex = this.requests.findIndex((request) => request.id === id);
    if (requestIndex < 0) return null;

    const updatedRequest = {
      ...this.requests[requestIndex],
      voiceCount: this.requests[requestIndex].voiceCount + 1,
    };
    this.requests[requestIndex] = updatedRequest;
    return { ...updatedRequest, schedules: [...updatedRequest.schedules] };
  }
}
