import * as BackgroundTask from 'expo-background-task';
import * as TaskManager from 'expo-task-manager';
import { Platform } from 'react-native';

import { logDevelopmentError, logDevelopmentWarning } from '@/lib/development-logger';
import { isSupabaseUuid } from '@/lib/identifiers';
import { alarmService } from '@/services/alarm-service';
import { morningRequestService } from '@/services/morning-request-service';
import { personalAlarmVoiceService } from '@/services/personal-alarm-voice-service';
import { useAppStore } from '@/store/use-app-store';

export const backgroundVoiceSyncTaskName = 'background-voice-sync';

// Defined at module scope so TaskManager can find it even when the OS
// re-evaluates this JS bundle headlessly (app killed, no UI mounted) to run
// the task. Without this, a Personal Voice recorded for A only ever reaches
// A's native alarm when A happens to open the app before the alarm fires --
// unworkable since A is normally asleep at that point. This periodic task
// re-runs the same sync the foreground screens already do, so the alarm's
// sound gets swapped to the Personal Voice as soon as it's ready, with no
// app launch required.
TaskManager.defineTask(backgroundVoiceSyncTaskName, async () => {
  if (Platform.OS !== 'android') {
    return BackgroundTask.BackgroundTaskResult.Success;
  }

  try {
    await useAppStore.persist.rehydrate();
    const { currentUser, currentMorningRequest, communityVoiceMessages } =
      useAppStore.getState();

    if (
      !currentUser ||
      !currentMorningRequest ||
      currentMorningRequest.status === 'completed' ||
      currentMorningRequest.userId !== currentUser.id
    ) {
      return BackgroundTask.BackgroundTaskResult.Success;
    }

    let requestForSync = currentMorningRequest;
    if (isSupabaseUuid(currentMorningRequest.id)) {
      try {
        const latestRequest = await morningRequestService.getRequest(
          currentMorningRequest.id
        );
        if (latestRequest?.userId === currentMorningRequest.userId) {
          requestForSync = latestRequest;
        }
      } catch (error) {
        // A stale local copy of the request is still enough to keep the
        // already-scheduled native alarm alive; only the voice sync below
        // needs the freshest data, and it tolerates a stale request too.
        logDevelopmentError('backgroundVoiceSync.refreshRequest', error);
      }
    }

    const scheduled = await alarmService.ensureScheduled(requestForSync);
    if (scheduled.status !== 'scheduled' || scheduled.alarm.deliveryMode !== 'native') {
      return BackgroundTask.BackgroundTaskResult.Success;
    }

    await personalAlarmVoiceService.syncForRequest(
      requestForSync,
      requestForSync.userId,
      undefined,
      communityVoiceMessages
    );
    return BackgroundTask.BackgroundTaskResult.Success;
  } catch (error) {
    logDevelopmentWarning('backgroundVoiceSync.run', error);
    return BackgroundTask.BackgroundTaskResult.Failed;
  }
});

export async function ensureBackgroundVoiceSyncRegistered(): Promise<void> {
  if (Platform.OS !== 'android' || !alarmService.isNativeAlarmAvailable()) return;

  try {
    const isRegistered = await TaskManager.isTaskRegisteredAsync(
      backgroundVoiceSyncTaskName
    );
    if (!isRegistered) {
      // 15 minutes is the Android WorkManager floor for periodic work --
      // Expo clamps to it regardless of what's requested here.
      await BackgroundTask.registerTaskAsync(backgroundVoiceSyncTaskName, {
        minimumInterval: 15,
      });
    }
  } catch (error) {
    logDevelopmentWarning('backgroundVoiceSync.register', error);
  }
}
