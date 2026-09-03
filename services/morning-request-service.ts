import * as Crypto from 'expo-crypto';

import { getNextWakeDate } from '@/features/morning/get-next-wake-date';
import { isSupabaseUuid } from '@/lib/identifiers';
import { logDevelopmentError } from '@/lib/development-logger';
import { MockMorningRequestRepository } from '@/repositories/mock/mock-morning-request-repository';
import type { MorningRequestRepository } from '@/repositories/interfaces/morning-request-repository';
import { SupabaseMorningRequestRepository } from '@/repositories/supabase/supabase-morning-request-repository';
import type { CreateMorningRequestInput, MorningRequest } from '@/types';

export class MorningRequestService {
  private readonly legacyMigrationPromises = new Map<
    string,
    Promise<MorningRequest>
  >();

  constructor(
    private readonly repository: MorningRequestRepository,
    private readonly mockRepository: MorningRequestRepository
  ) {}

  async createRequest(
    userId: string,
    input: CreateMorningRequestInput
  ): Promise<MorningRequest> {
    try {
      return await this.repository.create({
        id: Crypto.randomUUID(),
        userId,
        ...input,
        scheduledFor: getNextWakeDate(input.wakeAt).toISOString(),
        personalEligible: false,
        status: 'open',
        voiceCount: 0,
        createdAt: new Date().toISOString(),
      });
    } catch (error) {
      logDevelopmentError('morningRequest.create', error);
      throw error;
    }
  }

  async updateRequest(
    request: MorningRequest,
    input: CreateMorningRequestInput
  ): Promise<MorningRequest> {
    if (!isSupabaseUuid(request.id)) {
      return {
        ...request,
        ...input,
        scheduledFor: getNextWakeDate(input.wakeAt).toISOString(),
        schedules: [...input.schedules],
      };
    }

    try {
      const updatedRequest = await this.repository.update(request.id, input);

      if (!updatedRequest) {
        throw new Error('Morning request not found');
      }
      return updatedRequest;
    } catch (error) {
      logDevelopmentError('morningRequest.update', error);
      throw error;
    }
  }

  async getAvailableRequests(
    userId: string,
    currentRequestId?: string
  ): Promise<MorningRequest[]> {
    if (currentRequestId && !isSupabaseUuid(currentRequestId)) {
      return this.mockRepository.getAvailableRequests(userId);
    }

    try {
      return await this.repository.getAvailableRequests(userId);
    } catch (error) {
      logDevelopmentError('morningRequest.getAvailable.remote', error);
      throw error;
    }
  }

  async getRequest(id: string): Promise<MorningRequest | null> {
    const mockRequest = await this.mockRepository.getById(id);
    if (mockRequest) return mockRequest;

    try {
      return await this.repository.getById(id);
    } catch (error) {
      logDevelopmentError('morningRequest.getById', error);
      throw error;
    }
  }

  async isMockRequest(id: string): Promise<boolean> {
    return (await this.mockRepository.getById(id)) !== null;
  }

  async ensureRemoteRequest(request: MorningRequest): Promise<MorningRequest> {
    if (isSupabaseUuid(request.id)) return request;

    const existingMigration = this.legacyMigrationPromises.get(request.id);
    if (existingMigration) return existingMigration;

    const migration = this.createRequest(request.userId, {
      wakeAt: request.wakeAt,
      schedules: request.schedules,
      mood: request.mood,
      preferredVoiceStyle: request.preferredVoiceStyle,
      voiceRequestNote: request.voiceRequestNote,
    })
      .then(async (createdRequest) => {
        if (!request.personalEligible) return createdRequest;

        await this.markPersonalEligible(createdRequest.id);
        return {
          ...createdRequest,
          personalEligible: true,
        };
      })
      .catch((error) => {
        this.legacyMigrationPromises.delete(request.id);
        logDevelopmentError('morningRequest.migrateLegacy', error);
        return request;
      });

    this.legacyMigrationPromises.set(request.id, migration);
    return migration;
  }

  async markVoiceDelivered(id: string): Promise<MorningRequest> {
    const request = await this.mockRepository.incrementVoiceCount(id);
    if (!request) {
      throw new Error('Morning request not found');
    }
    return request;
  }

  async markPersonalEligible(id: string): Promise<void> {
    if (!isSupabaseUuid(id)) return;

    try {
      const request = await this.repository.markPersonalEligible(id);
      if (!request) throw new Error('Current morning request not found');
    } catch (error) {
      logDevelopmentError('morningRequest.markPersonalEligible', error);
      throw error;
    }
  }

  async markCommunityReady(id: string): Promise<void> {
    if (!isSupabaseUuid(id)) return;

    try {
      const request = await this.repository.markCommunityReady(id);
      if (!request) throw new Error('Current morning request not found');
    } catch (error) {
      logDevelopmentError('morningRequest.markCommunityReady', error);
      throw error;
    }
  }

  async markCompleted(id: string): Promise<void> {
    const repository = isSupabaseUuid(id)
      ? this.repository
      : this.mockRepository;
    try {
      const request = await repository.markCompleted(id);
      if (!request) throw new Error('Current morning request not found');
    } catch (error) {
      logDevelopmentError('morningRequest.markCompleted', error);
      throw error;
    }
  }

  async resetPrototypeData(): Promise<void> {
    this.legacyMigrationPromises.clear();
    await this.mockRepository.reset();
    try {
      await this.repository.reset();
    } catch (error) {
      logDevelopmentError('morningRequest.reset.remote', error);
    }
  }
}

export const morningRequestService = new MorningRequestService(
  new SupabaseMorningRequestRepository(),
  new MockMorningRequestRepository()
);
