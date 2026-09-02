import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, Platform } from 'react-native';

import { logDevelopmentError } from '@/lib/development-logger';
import { isSupabaseUuid } from '@/lib/identifiers';
import { alarmService, type AlarmSetupResult } from '@/services/alarm-service';
import { morningRequestService } from '@/services/morning-request-service';
import { personalAlarmVoiceService } from '@/services/personal-alarm-voice-service';
import type { MorningRequest, VoiceMessage } from '@/types';

type AlarmScheduleState = AlarmSetupResult | { status: 'loading' | 'scheduling' };
export type PersonalVoiceSyncStatus =
  | 'not-needed'
  | 'checking'
  | 'waiting'
  | 'voice-ready'
  | 'error';

export function useAlarmSchedule(request: MorningRequest | null) {
  const [state, setState] = useState<AlarmScheduleState>({ status: 'loading' });
  const [personalVoiceSyncStatus, setPersonalVoiceSyncStatus] =
    useState<PersonalVoiceSyncStatus>('not-needed');
  const [preparedPersonalVoice, setPreparedPersonalVoice] =
    useState<VoiceMessage | null>(null);
  const [attempt, setAttempt] = useState(0);
  const appStateRef = useRef(AppState.currentState);

  const retry = useCallback(() => setAttempt((value) => value + 1), []);
  const openSettings = useCallback(() => alarmService.openSettings(), []);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextState) => {
      const becameActive = appStateRef.current !== 'active' && nextState === 'active';
      appStateRef.current = nextState;
      if (becameActive) setAttempt((value) => value + 1);
    });
    return () => subscription.remove();
  }, []);

  useEffect(() => {
    if (!request || request.status === 'completed') {
      setState({ status: 'loading' });
      setPersonalVoiceSyncStatus('not-needed');
      setPreparedPersonalVoice(null);
      return;
    }

    const activeRequest = request;
    let isActive = true;
    setState({ status: 'scheduling' });

    async function scheduleAndSync() {
      try {
        let requestForSync = activeRequest;
        if (isSupabaseUuid(activeRequest.id)) {
          try {
            const latestRequest = await morningRequestService.getRequest(
              activeRequest.id
            );
            if (latestRequest?.userId === activeRequest.userId) {
              requestForSync = latestRequest;
            }
          } catch (error) {
            // Network failure must not prevent the already-known alarm from
            // being registered with AlarmKit.
            logDevelopmentError('alarmSchedule.refreshRequest', error);
          }
        }

        const result = await alarmService.ensureScheduled(requestForSync);
        if (!isActive) return;
        setState(result);

        const shouldSyncPersonalVoice =
          result.status === 'scheduled' &&
          result.alarm.deliveryMode === 'native' &&
          Platform.OS === 'ios' &&
          isSupabaseUuid(requestForSync.id);
        if (!shouldSyncPersonalVoice) {
          setPersonalVoiceSyncStatus('not-needed');
          return;
        }
        setPersonalVoiceSyncStatus('checking');
        const voiceResult = await personalAlarmVoiceService.syncForRequest(
          requestForSync,
          requestForSync.userId
        );
        if (!isActive) return;

        if (voiceResult.status === 'ready') {
          setState({ status: 'scheduled', alarm: voiceResult.alarm });
          setPersonalVoiceSyncStatus('voice-ready');
          setPreparedPersonalVoice(voiceResult.personalVoice ?? null);
        } else {
          setPreparedPersonalVoice(null);
          setPersonalVoiceSyncStatus(
            voiceResult.status === 'waiting' ? 'waiting' : 'error'
          );
        }
      } catch (error) {
        logDevelopmentError('alarmSchedule.sync', error);
        if (isActive) {
          setState({ status: 'error' });
          setPersonalVoiceSyncStatus('error');
        }
      }
    }

    void scheduleAndSync();
    return () => {
      isActive = false;
    };
  }, [attempt, request]);

  return {
    isNativeAlarmAvailable: alarmService.isNativeAlarmAvailable(),
    state,
    personalVoiceSyncStatus,
    preparedPersonalVoice,
    retry,
    openSettings,
  };
}
