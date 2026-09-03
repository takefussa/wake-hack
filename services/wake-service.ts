import * as Crypto from 'expo-crypto';
import { Asset } from 'expo-asset';
import { File } from 'expo-file-system';

import { logDevelopmentError } from '@/lib/development-logger';
import { isSupabaseUuid } from '@/lib/identifiers';
import type { WakeAssignmentRepository } from '@/repositories/interfaces/wake-assignment-repository';
import type { WakeSessionRepository } from '@/repositories/interfaces/wake-session-repository';
import type { WakeVoiceRepository } from '@/repositories/interfaces/wake-voice-repository';
import { MockWakeVoiceRepository } from '@/repositories/mock/mock-wake-voice-repository';
import { SupabaseWakeAssignmentRepository } from '@/repositories/supabase/supabase-wake-assignment-repository';
import { SupabaseWakeSessionRepository } from '@/repositories/supabase/supabase-wake-session-repository';
import { SupabaseWakeVoiceRepository } from '@/repositories/supabase/supabase-wake-voice-repository';
import type {
  MorningRequest,
  VoiceMessage,
  WakeAssignment,
  WakeSession,
} from '@/types';

export type WakeVoiceAssignmentMode =
  | 'personal'
  | 'community'
  | 'community_fallback';

export type WakeVoiceAssignment = {
  voice: VoiceMessage;
  mode: WakeVoiceAssignmentMode;
  persistedAssignment?: WakeAssignment;
};

export type PersonalAlarmVoicePreparation =
  | {
      status: 'ready';
      voice: VoiceMessage;
    }
  | {
      status:
        | 'waiting'
        | 'ineligible';
    };

export type CommunityAlarmVoicePreparation = {
  status: 'ready';
  voice: VoiceMessage;
};

export type WakeExperience =
  WakeVoiceAssignment & {
    session: WakeSession;
  };

type StartWakeExperienceOptions = {
  isDemo?: boolean;
};

function isUsableLocalVoiceUri(uri: string | undefined): boolean {
  if (!uri) return false;
  if (/^(https?|blob):/.test(uri)) return true;
  try {
    return new File(uri).exists;
  } catch {
    return false;
  }
}

export class WakeService {
  constructor(
    private readonly repository:
      WakeVoiceRepository,
    private readonly demoRepository:
      WakeVoiceRepository,
    private readonly assignmentRepository:
      WakeAssignmentRepository,
    private readonly sessionRepository:
      WakeSessionRepository
  ) {}

  async assignWakeVoice(
    request: MorningRequest,
    receiverId: string,
    givenVoiceMessages: VoiceMessage[] = []
  ): Promise<WakeVoiceAssignment> {
    if (isSupabaseUuid(request.id)) {
      try {
        const persistedAssignment =
          await this.assignmentRepository.assign(
            request.id
          );

        if (
          persistedAssignment.type ===
            'personal' &&
          persistedAssignment.voiceMessageId
        ) {
          try {
            const personalVoice =
              await this.repository.findPersonalById(
                persistedAssignment.voiceMessageId,
                request,
                receiverId
              );

            if (
              personalVoice?.type ===
              'personal'
            ) {
              return {
                voice: personalVoice,
                mode: 'personal',
                persistedAssignment,
              };
            }
          } catch (error) {
            logDevelopmentError(
              'wake.loadAssignedPersonal',
              error
            );
          }
        }

        const communityVoice =
          await this.repository.findCommunityForRequest(
            request,
            receiverId
          );

        return {
          voice: communityVoice,
          mode: request.personalEligible
            ? 'community_fallback'
            : 'community',
          persistedAssignment,
        };
      } catch (error) {
        logDevelopmentError(
          'wake.assignRemote',
          error
        );
      }
    }

    if (request.personalEligible) {
      try {
        const personalVoice =
          await this.repository.findPersonalForRequest(
            request,
            receiverId
          );

        if (
          personalVoice?.type ===
          'personal'
        ) {
          return {
            voice: personalVoice,
            mode: 'personal',
          };
        }
      } catch (error) {
        logDevelopmentError(
          'wake.findPersonal',
          error
        );
      }

      const hasMockGive =
        givenVoiceMessages.some(
          (voice) =>
            voice.type === 'personal' &&
            voice.senderId === receiverId &&
            !voice.storagePath
        );

      if (hasMockGive) {
        const demoVoice =
          await this.demoRepository.findPersonalForRequest(
            request,
            receiverId
          );

        if (
          demoVoice?.type ===
          'personal'
        ) {
          return {
            voice: demoVoice,
            mode: 'personal',
          };
        }
      }
    }

    const communityVoice =
      await this.repository.findCommunityForRequest(
        request,
        receiverId
      );

    return {
      voice: communityVoice,
      mode: request.personalEligible
        ? 'community_fallback'
        : 'community',
    };
  }

  async preparePersonalAlarmVoice(
    request: MorningRequest,
    receiverId: string,
    voiceMessageId?: string
  ): Promise<PersonalAlarmVoicePreparation> {
    if (!isSupabaseUuid(request.id)) {
      return {
        status: 'ineligible',
      };
    }

    const candidate =
      voiceMessageId
        ? await this.repository.findPersonalById(
            voiceMessageId,
            request,
            receiverId
          )
        : await this.repository.findPersonalForAlarm(
            request,
            receiverId
          );

    if (
      !candidate ||
      candidate.type !== 'personal'
    ) {
      return {
        status: 'waiting',
      };
    }

    return {
      status: 'ready',
      voice: candidate,
    };
  }

  async prepareCommunityAlarmVoice(
    request: MorningRequest,
    receiverId: string,
    localVoices: VoiceMessage[] = []
  ): Promise<CommunityAlarmVoicePreparation> {
    const matching = localVoices
      .filter((voice) => voice.type === 'community')
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    // A freshly recorded local voice without a storage path means its shared
    // upload failed. It must still be usable as the immediate Community Voice
    // on this device, just as it was before the merge.
    const unsyncedLocal = matching.find(
      (voice) => !voice.storagePath && voice.voiceStyle === request.preferredVoiceStyle
    ) ?? matching.find((voice) => !voice.storagePath);
    if (unsyncedLocal?.uri && isUsableLocalVoiceUri(unsyncedLocal.uri)) {
      return {
        status: 'ready',
        voice: { ...unsyncedLocal, receiverId, morningRequestId: request.id },
      };
    }

    // Supabase is the shared source of truth once an upload exists: choose
    // the newest matching Community Voice before older local copies.
    try {
      const remoteVoice = await this.repository.findCommunityForRequest(
        request,
        receiverId
      );
      if (remoteVoice.storagePath && remoteVoice.uri) {
        return { status: 'ready', voice: remoteVoice };
      }
    } catch (error) {
      logDevelopmentError('wake.findCommunity', error);
    }

    const selected = matching.find((voice) => voice.voiceStyle === request.preferredVoiceStyle) ?? matching[0];
    if (selected?.uri && isUsableLocalVoiceUri(selected.uri)) {
      return { status: 'ready', voice: { ...selected, receiverId, morningRequestId: request.id } };
    }
    const asset = Asset.fromModule(
      require('../assets/audio/community-wake.wav')
    );
    if (!asset.localUri) {
      await asset.downloadAsync();
    }
    const uri = asset.localUri ?? asset.uri;
    if (!uri) {
      throw new Error('The bundled Community Voice could not be prepared');
    }

    return {
      status: 'ready',
      voice: {
        id: 'community-wake-bundled-v1',
        senderId: 'community',
        receiverId,
        morningRequestId: request.id,
        uri,
        durationMs: 6_846,
        type: 'community',
        createdAt: '2026-08-20T01:00:00.000Z',
      },
    };
  }

  async startWakeExperience(
    request: MorningRequest,
    receiverId: string,
    givenVoiceMessages: VoiceMessage[] = [],
    options: StartWakeExperienceOptions = {}
  ): Promise<WakeExperience> {
    const assignment =
      await this.assignWakeVoice(
        request,
        receiverId,
        givenVoiceMessages
      );

    const localSession: WakeSession = {
      id: isSupabaseUuid(request.id)
        ? Crypto.randomUUID()
        : `wake-session-${Date.now()}`,
      userId: receiverId,
      morningRequestId: request.id,
      wakeAssignmentId:
        assignment.persistedAssignment?.id,
      voiceMessageId:
        assignment.voice.id,
      alarmAt: request.wakeAt,
      scheduledFor:
        request.scheduledFor,
      missionCompleted: false,
      isDemo: options.isDemo ?? false,
      status: 'ringing',
    };

    if (
      isSupabaseUuid(request.id) &&
      assignment.persistedAssignment
    ) {
      try {
        const persistedSession =
          await this.sessionRepository.start({
            ...localSession,
            wakeAssignmentId:
              assignment.persistedAssignment.id,
          });

        return {
          ...assignment,
          session: {
            ...persistedSession,
            voiceMessageId:
              assignment.voice.id,
            isDemo:
              options.isDemo ?? false,
          },
        };
      } catch (error) {
        logDevelopmentError(
          'wake.session.start',
          error
        );
      }
    }

    return {
      ...assignment,
      session: localSession,
    };
  }

  async completeWakeSession(
    session: WakeSession
  ): Promise<void> {
    if (
      !session.wakeAssignmentId ||
      !isSupabaseUuid(session.id)
    ) {
      return;
    }

    try {
      await this.sessionRepository.complete(
        session.id,
        session.wokeAt ??
          new Date().toISOString()
      );
    } catch (error) {
      logDevelopmentError(
        'wake.session.complete',
        error
      );
    }
  }

  async cancelWakeSession(
    session: WakeSession
  ): Promise<void> {
    if (
      !session.wakeAssignmentId ||
      !isSupabaseUuid(session.id)
    ) {
      return;
    }

    try {
      await this.sessionRepository.delete(
        session.id
      );
    } catch (error) {
      logDevelopmentError(
        'wake.session.cancel',
        error
      );
    }
  }
}

const mockWakeVoiceRepository =
  new MockWakeVoiceRepository();

export const wakeService =
  new WakeService(
    new SupabaseWakeVoiceRepository(
      mockWakeVoiceRepository
    ),
    mockWakeVoiceRepository,
    new SupabaseWakeAssignmentRepository(),
    new SupabaseWakeSessionRepository()
  );
