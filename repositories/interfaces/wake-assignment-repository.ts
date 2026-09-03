import type { WakeAssignment } from '@/types';

export interface WakeAssignmentRepository {
  assign(morningRequestId: string): Promise<WakeAssignment>;
}
