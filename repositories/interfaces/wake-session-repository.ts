import type { WakeSession } from '@/types';

export type PersistedWakeSessionInput = WakeSession & {
  wakeAssignmentId: string;
};

export interface WakeSessionRepository {
  findByMorningRequestId(morningRequestId: string): Promise<WakeSession | null>;
  start(session: PersistedWakeSessionInput): Promise<WakeSession>;
  complete(sessionId: string, wokeAt: string): Promise<WakeSession>;
  delete(sessionId: string): Promise<void>;
}
