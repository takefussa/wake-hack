import { mockCommunityVoices } from '@/data/mock-voices';
import { bindWakeVoice } from '@/features/wake/bind-wake-voice';
import type { CommunityVoiceRepository } from '@/repositories/interfaces/community-voice-repository';
import type {
  CommunityVoice,
  CommunityVoiceStats,
  CreateCommunityVoiceInput,
  WakeStyle,
} from '@/types';

function toCommunityVoice(input: CreateCommunityVoiceInput): CommunityVoice {
  return {
    id: `mock-community-${Date.now()}`,
    senderId: input.senderId,
    audioPath: input.uri,
    uri: input.uri,
    durationMs: input.durationMs,
    wakeStyle: input.wakeStyle,
    moderationStatus: 'approved',
    playCount: 0,
    thanksCount: 0,
    createdAt: new Date().toISOString(),
  };
}

export class MockCommunityVoiceRepository implements CommunityVoiceRepository {
  private voices: CommunityVoice[] = [];
  private thanks = new Set<string>();

  async create(input: CreateCommunityVoiceInput): Promise<CommunityVoice> {
    const voice = toCommunityVoice(input);
    this.voices = [voice, ...this.voices];
    return voice;
  }

  async assignForWakeStyle(
    wakeStyle: WakeStyle,
    receiverId: string
  ): Promise<{ voice: CommunityVoice; deliveryId: string } | null> {
    const voice =
      this.voices.find(
        (candidate) =>
          candidate.wakeStyle === wakeStyle &&
          candidate.senderId !== receiverId &&
          candidate.moderationStatus === 'approved'
      ) ?? null;

    if (!voice) return null;

    return {
      voice,
      deliveryId: `mock-delivery:${voice.id}:${receiverId}`,
    };
  }

  async markPlayed(deliveryId: string): Promise<void> {
    const voiceId = deliveryId.split(':')[1];
    const voice = this.voices.find((candidate) => candidate.id === voiceId);
    if (voice) voice.playCount += 1;
  }

  async sendThanks(voiceId: string, userId: string): Promise<void> {
    const key = `${voiceId}:${userId}`;
    if (this.thanks.has(key)) return;
    this.thanks.add(key);
    const voice = this.voices.find((candidate) => candidate.id === voiceId);
    if (voice) voice.thanksCount += 1;
  }

  async hasThanks(voiceId: string, userId: string): Promise<boolean> {
    return this.thanks.has(`${voiceId}:${userId}`);
  }

  async getStats(userId: string): Promise<CommunityVoiceStats> {
    return this.voices
      .filter((voice) => voice.senderId === userId)
      .reduce<CommunityVoiceStats>(
        (stats, voice) => ({
          wakeCount: stats.wakeCount + voice.playCount,
          thanksCount: stats.thanksCount + voice.thanksCount,
        }),
        { wakeCount: 0, thanksCount: 0 }
      );
  }

  async listMine(userId: string): Promise<CommunityVoice[]> {
    return this.voices.filter((voice) => voice.senderId === userId);
  }

  async deleteMine(voiceId: string, userId: string): Promise<void> {
    this.voices = this.voices.filter(
      (voice) => voice.id !== voiceId || voice.senderId !== userId
    );
  }
}

export function getMockWakeVoice(receiverId: string, morningRequestId: string) {
  return bindWakeVoice(mockCommunityVoices[0], morningRequestId, receiverId);
}
