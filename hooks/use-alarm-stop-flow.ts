import { router } from 'expo-router';
import { useEffect, useRef } from 'react';
import { AppState } from 'react-native';

import { logDevelopmentError } from '@/lib/development-logger';
import { alarmService } from '@/services/alarm-service';
import { wakeService } from '@/services/wake-service';
import { useAppStore } from '@/store/use-app-store';

export function useAlarmStopFlow(enabled: boolean) {
  const currentUser = useAppStore((state) => state.currentUser);
  const currentMorningRequest = useAppStore(
    (state) => state.currentMorningRequest
  );
  const completeWakeSession = useAppStore((state) => state.completeWakeSession);
  const isConsumingRef = useRef(false);

  useEffect(() => {
    if (!enabled || !currentUser || !currentMorningRequest) return;

    async function consumeStop() {
      if (isConsumingRef.current) return;
      isConsumingRef.current = true;
      try {
        const stopped = await alarmService.consumeStoppedAlarm();
        if (
          !stopped ||
          stopped.morningRequestId !== currentMorningRequest!.id ||
          stopped.sound === 'default'
        ) {
          return;
        }

        // The store already holds the real assignedWakeVoice/wakeSession set
        // when the alarm was originally scheduled (Personal or Community,
        // with a real playable uri). Reuse that instead of fabricating a
        // placeholder VoiceMessage, so /wake/alarm can actually play it back.
        const completed = completeWakeSession();
        if (completed) {
          void wakeService.completeWakeSession(completed);
        }
        router.replace({ pathname: '/wake/alarm', params: { review: '1' } });
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
  }, [completeWakeSession, currentMorningRequest, currentUser, enabled]);
}
