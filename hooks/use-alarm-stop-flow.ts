import * as Crypto from 'expo-crypto';
import { router } from 'expo-router';
import { useEffect, useRef } from 'react';
import { AppState } from 'react-native';

import { logDevelopmentError } from '@/lib/development-logger';
import { alarmService } from '@/services/alarm-service';
import { useAppStore } from '@/store/use-app-store';
import type { VoiceMessage, WakeSession } from '@/types';

export function useAlarmStopFlow(enabled: boolean) {
  const currentUser = useAppStore((state) => state.currentUser);
  const currentMorningRequest = useAppStore(
    (state) => state.currentMorningRequest
  );
  const startWakeSession = useAppStore((state) => state.startWakeSession);
  const isConsumingRef = useRef(false);

  useEffect(() => {
    if (!enabled || !currentUser || !currentMorningRequest) return;

    async function consumeStop() {
      if (isConsumingRef.current) return;
      isConsumingRef.current = true;
      try {
        const alarm = await alarmService.consumeStoppedAlarm();
        if (
          !alarm ||
          alarm.morningRequestId !== currentMorningRequest!.id ||
          alarm.sound === 'default' ||
          !alarm.voiceMessageId ||
          !alarm.voiceSenderId
        ) {
          return;
        }

        const voice: VoiceMessage = {
          id: alarm.voiceMessageId,
          senderId: alarm.voiceSenderId,
          receiverId: currentUser!.id,
          morningRequestId: currentMorningRequest!.id,
          uri: '',
          durationMs: 1,
          type: alarm.sound,
          createdAt: new Date().toISOString(),
        };
        const session: WakeSession = {
          id: Crypto.randomUUID(),
          userId: currentUser!.id,
          morningRequestId: currentMorningRequest!.id,
          voiceMessageId: voice.id,
          alarmAt: currentMorningRequest!.wakeAt,
          scheduledFor: alarm.scheduledFor,
          missionCompleted: false,
          isDemo: false,
          status: 'ringing',
        };

        if (startWakeSession(voice, session)) {
          // AlarmKit's stop action only dismisses the alarm. Keep the new UI
          // Wake Mission in the foreground so the user must complete the
          // wake proof before reaching the thank-you flow.
          router.replace('/wake/mission');
        }
      } catch (error) {
        logDevelopmentError('alarmStopFlow.consume', error);
      } finally {
        isConsumingRef.current = false;
      }
    }

    void consumeStop();
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') void consumeStop();
    });
    return () => subscription.remove();
  }, [currentMorningRequest, currentUser, enabled, startWakeSession]);
}
