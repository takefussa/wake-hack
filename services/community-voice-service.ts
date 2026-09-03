import { mapVoiceStyleToWakeStyle } from '@/constants/community-voice';
import { prototypeConfig } from '@/constants/config';
import { logDevelopmentError } from '@/lib/development-logger';
import type { CommunityVoiceRepository } from '@/repositories/interfaces/community-voice-repository';
import {
  getMockWakeVoice,
  MockCommunityVoiceRepository,
} from '@/repositories/mock/mock-community-voice-repository';
import {
  mapCommunityVoiceToWakeVoice,
  SupabaseCommunityVoiceRepository,
} from '@/repositories/supabase/supabase-community-voice-repository';
import type {
  CommunityVoice,
  CommunityVoiceStats,
  CreateCommunityVoiceInput,
  MorningRequest,
  VoiceMessage,
} from '@/types';

export class CommunityVoiceService {
  constructor(
    private readonly repository: CommunityVoiceRepository,
    private readonly fallbackRepository: CommunityVoiceRepository
  ) {}

  async create(input: CreateCommunityVoiceInput): Promise<CommunityVoice> {
    if (!input.uri.trim()) {
      throw new Error('Recording URI is required');
    }
    if (
      input.durationMs < prototypeConfig.recordingMinMs ||
      input.durationMs > prototypeConfig.recordingMaxMs
    ) {
      throw new Error('Recording duration is outside the allowed range');
    }

    try {
      return await this.repository.create(input);
    } catch (error) {
      logDevelopmentError('communityVoice.create', error);
      throw error;
    }
  }

  async getCommunityWakeVoice(
    request: MorningRequest,
    receiverId: string
  ): Promise<VoiceMessage> {
    const wakeStyle = mapVoiceStyleToWakeStyle(request.preferredVoiceStyle);

    try {
      const assignment = await this.repository.assignForWakeStyle(wakeStyle, receiverId);
      if (assignment) {
        return mapCommunityVoiceToWakeVoice(
          assignment.voice,
          receiverId,
          request.id,
          assignment.deliveryId
        );
      }
    } catch (error) {
      logDevelopmentError('communityVoice.assign', error);
    }

    return getMockWakeVoice(receiverId, request.id);
  }

  async markPlayed(voice: VoiceMessage): Promise<void> {
    if (voice.type !== 'community' || !voice.deliveryId) return;
    try {
      if (!isUuid(voice.deliveryId)) {
        await this.fallbackRepository.markPlayed(voice.deliveryId);
        return;
      }
      await this.repository.markPlayed(voice.deliveryId);
    } catch (error) {
      logDevelopmentError('communityVoice.markPlayed', error);
    }
  }

  async sendThanks(voiceId: string, userId: string): Promise<void> {
    try {
      if (!isUuid(voiceId)) {
        await this.fallbackRepository.sendThanks(voiceId, userId);
        return;
      }
      await this.repository.sendThanks(voiceId, userId);
    } catch (error) {
      logDevelopmentError('communityVoice.thanks', error);
      throw error;
    }
  }

  async hasThanks(voiceId: string, userId: string): Promise<boolean> {
    try {
      if (!isUuid(voiceId)) {
        return this.fallbackRepository.hasThanks(voiceId, userId);
      }
      return await this.repository.hasThanks(voiceId, userId);
    } catch (error) {
      logDevelopmentError('communityVoice.hasThanks', error);
      return false;
    }
  }

  async getStats(userId: string): Promise<CommunityVoiceStats> {
    try {
      return await this.repository.getStats(userId);
    } catch (error) {
      logDevelopmentError('communityVoice.stats', error);
      return this.fallbackRepository.getStats(userId);
    }
  }

  async listMine(userId: string): Promise<CommunityVoice[]> {
    try {
      return await this.repository.listMine(userId);
    } catch (error) {
      logDevelopmentError('communityVoice.listMine', error);
      return this.fallbackRepository.listMine(userId);
    }
  }

  async deleteMine(voiceId: string, userId: string): Promise<void> {
    try {
      if (!isUuid(voiceId)) {
        await this.fallbackRepository.deleteMine(voiceId, userId);
        return;
      }
      await this.repository.deleteMine(voiceId, userId);
    } catch (error) {
      logDevelopmentError('communityVoice.deleteMine', error);
      throw error;
    }
  }
}

const mockCommunityVoiceRepository = new MockCommunityVoiceRepository();

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value
  );
}

export const communityVoiceService = new CommunityVoiceService(
  new SupabaseCommunityVoiceRepository(),
  mockCommunityVoiceRepository
);
