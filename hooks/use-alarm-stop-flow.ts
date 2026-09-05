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
  const givenVoiceMessages = useAppStore((state) => state.givenVoiceMessages);
  const startWakeSession = useAppStore((state) => state.startWakeSession);
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
          stopped.morningRequestId !== currentMorningRequest!.id
        ) {
          return;
        }

        const experience = await wakeService.startWakeExperience(
          currentMorningRequest!,
          currentUser!.id,
          givenVoiceMessages,
          { isDemo: false }
        );
        if (startWakeSession(experience.voice, experience.session)) {
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
  }, [
    currentMorningRequest,
    currentUser,
    enabled,
    givenVoiceMessages,
    startWakeSession,
  ]);
}
