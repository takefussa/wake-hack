import {
  getRecordingPermissionsAsync,
  IOSOutputFormat,
  RecordingPresets,
  requestRecordingPermissionsAsync,
  setAudioModeAsync,
  useAudioPlayer,
  useAudioPlayerStatus,
  useAudioRecorder,
  useAudioRecorderState,
} from 'expo-audio';
import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';

import { prototypeConfig } from '@/constants/config';

const recordingOptions = {
  ...RecordingPresets.HIGH_QUALITY,
  // Keep the proven AAC/M4A recorder format. AlarmKit converts this file to a
  // Linear PCM WAV after download. Direct LINEARPCM recording on iOS 26 can
  // produce a header-only WAV (zero audio frames), which results in a silent
  // human-voice alarm even though recording appears to succeed.
  numberOfChannels: 1,
  ios: {
    ...RecordingPresets.HIGH_QUALITY.ios,
    extension: '.m4a',
    outputFormat: IOSOutputFormat.MPEG4AAC,
  },
  isMeteringEnabled: true,
};

export type MicrophonePermissionState = 'checking' | 'granted' | 'denied';

export type LocalVoiceRecording = {
  uri: string;
  durationMs: number;
};

export function useVoiceRecorder() {
  const [permissionState, setPermissionState] =
    useState<MicrophonePermissionState>('checking');
  const [canAskPermissionAgain, setCanAskPermissionAgain] = useState(true);
  const [isRequestingPermission, setIsRequestingPermission] = useState(false);
  const [recording, setRecording] = useState<LocalVoiceRecording | null>(null);
  const [isBusy, setIsBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const recorder = useAudioRecorder(recordingOptions);
  const recorderState = useAudioRecorderState(recorder, 100);
  const player = useAudioPlayer(null, { updateInterval: 100 });
  const playerStatus = useAudioPlayerStatus(player);
  const hasActiveRecording = useRef(false);
  const isStarting = useRef(false);
  const isFinalizing = useRef(false);
  const recordingStartedAt = useRef<number | null>(null);
  const latestRecordingDurationMs = useRef(0);
  const autoStopTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!recorderState.isRecording) return;
    latestRecordingDurationMs.current = Math.max(
      latestRecordingDurationMs.current,
      recorderState.durationMillis
    );
  }, [recorderState.durationMillis, recorderState.isRecording]);

  const clearAutoStopTimer = useCallback(() => {
    if (autoStopTimer.current) {
      clearTimeout(autoStopTimer.current);
      autoStopTimer.current = null;
    }
  }, []);

  useEffect(() => {
    if (!recording?.uri) return;

    try {
      // Pause unconditionally rather than trusting `player.playing`: that flag comes from
      // a polled status hook and can lag the native player by up to its update interval,
      // so a still-playing previous take could otherwise keep running into the new source
      // and make `replace` appear to auto-resume playback.
      player.pause();
      player.replace({ uri: recording.uri });
      player.pause();
    } catch {
      setError('録音した声の再生を準備できませんでした。');
    }
  }, [player, recording?.uri]);

  useEffect(() => {
    let isMounted = true;

    async function checkPermission() {
      try {
        const permission = await getRecordingPermissionsAsync();
        if (!isMounted) return;
        setPermissionState(permission.granted ? 'granted' : 'denied');
        setCanAskPermissionAgain(permission.canAskAgain);
        if (permission.granted) {
          setError(null);
        }
      } catch {
        if (isMounted) {
          setPermissionState('denied');
          setError('マイクの状態を確認できませんでした。');
        }
      }
    }

    void checkPermission();
    const appStateSubscription = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'active') {
        void checkPermission();
      }
    });

    return () => {
      isMounted = false;
      appStateSubscription.remove();
    };
  }, []);

  const requestPermission = useCallback(async (): Promise<boolean> => {
    setIsRequestingPermission(true);
    setError(null);

    try {
      const permission = await requestRecordingPermissionsAsync();
      setPermissionState(permission.granted ? 'granted' : 'denied');
      setCanAskPermissionAgain(permission.canAskAgain);
      if (!permission.granted) {
        setError('マイクが許可されていません。設定から変更できます。');
      }
      return permission.granted;
    } catch {
      setPermissionState('denied');
      setError('マイクの許可を確認できませんでした。');
      return false;
    } finally {
      setIsRequestingPermission(false);
    }
  }, []);

  const finishRecording = useCallback(async () => {
    if (!hasActiveRecording.current || isFinalizing.current) return;

    isFinalizing.current = true;
    setIsBusy(true);
    setError(null);
    clearAutoStopTimer();

    try {
      const elapsedBeforeStop = recordingStartedAt.current
        ? Date.now() - recordingStartedAt.current
        : 0;
      const durationBeforeStop = Math.max(
        latestRecordingDurationMs.current,
        elapsedBeforeStop,
        Math.round(recorder.currentTime * 1_000)
      );

      if (recorder.isRecording) {
        await recorder.stop();
      }

      const status = recorder.getStatus();
      const uri = recorder.uri ?? status.url;
      if (!uri) {
        throw new Error('Recording URI unavailable');
      }

      setRecording({
        uri,
        durationMs: Math.min(
          prototypeConfig.recordingMaxMs,
          Math.max(
            durationBeforeStop,
            status.durationMillis,
            Math.round(recorder.currentTime * 1_000)
          )
        ),
      });
      hasActiveRecording.current = false;
      recordingStartedAt.current = null;
      await setAudioModeAsync({
        allowsRecording: false,
        playsInSilentMode: true,
      }).catch(() => undefined);
    } catch {
      setError('録音を停止できませんでした。もう一度お試しください。');
      hasActiveRecording.current = recorder.isRecording;
    } finally {
      isFinalizing.current = false;
      setIsBusy(false);
    }
  }, [clearAutoStopTimer, recorder]);

  const startRecording = useCallback(async () => {
    if (isBusy || isStarting.current || recorderState.isRecording) return;

    isStarting.current = true;

    try {
      let hasPermission = permissionState === 'granted';
      if (!hasPermission) {
        hasPermission = await requestPermission();
      }
      if (!hasPermission) return;

      setIsBusy(true);
      setError(null);
      setRecording(null);
      latestRecordingDurationMs.current = 0;
      recordingStartedAt.current = null;
      try {
        player.pause();
      } catch {
        // Starting a new recording remains available even if the player has no source yet.
      }
      await setAudioModeAsync({
        allowsRecording: true,
        playsInSilentMode: true,
        interruptionMode: 'doNotMix',
      });
      await recorder.prepareToRecordAsync();
      hasActiveRecording.current = true;
      recordingStartedAt.current = Date.now();
      recorder.record();
      autoStopTimer.current = setTimeout(() => {
        void finishRecording();
      }, prototypeConfig.recordingMaxMs + 100);
    } catch {
      hasActiveRecording.current = false;
      setError('録音を始められませんでした。もう一度お試しください。');
      await setAudioModeAsync({ allowsRecording: false, playsInSilentMode: true }).catch(
        () => undefined
      );
    } finally {
      isStarting.current = false;
      setIsBusy(false);
    }
  }, [finishRecording, isBusy, permissionState, player, recorder, recorderState.isRecording, requestPermission]);

  const togglePlayback = useCallback(async () => {
    if (!recording || isBusy) return;
    setError(null);

    try {
      if (!player.isLoaded) {
        setError('再生の準備中です。少し待ってからお試しください。');
        return;
      }
      await setAudioModeAsync({ allowsRecording: false, playsInSilentMode: true });
      if (playerStatus.playing) {
        player.pause();
        return;
      }
      if (
        playerStatus.didJustFinish ||
        playerStatus.currentTime >= Math.max(0, playerStatus.duration - 0.05)
      ) {
        await player.seekTo(0);
      }
      player.play();
    } catch {
      setError('録音した声を再生できませんでした。');
    }
  }, [isBusy, player, playerStatus, recording]);

  const resetRecording = useCallback(() => {
    try {
      player.pause();
    } catch {
      // Reset remains available even if the native player has already stopped.
    }
    setRecording(null);
    latestRecordingDurationMs.current = 0;
    recordingStartedAt.current = null;
    setError(null);
  }, [player]);

  const leaveRecording = useCallback(async () => {
    clearAutoStopTimer();

    try {
      if (player.playing) {
        player.pause();
      }
    } catch {
      // The player may already be released while a native back gesture is completing.
    }

    const shouldStopRecording = hasActiveRecording.current;
    hasActiveRecording.current = false;
    recordingStartedAt.current = null;
    if (shouldStopRecording) {
      try {
        await recorder.stop();
      } catch {
        // Leaving the screen should not be blocked by recorder cleanup.
      }
    }

    await setAudioModeAsync({ allowsRecording: false, playsInSilentMode: true }).catch(
      () => undefined
    );
  }, [clearAutoStopTimer, player, recorder]);

  useEffect(() => {
    return () => {
      clearAutoStopTimer();
      const shouldStopRecording = hasActiveRecording.current;
      hasActiveRecording.current = false;
      recordingStartedAt.current = null;
      if (shouldStopRecording) {
        try {
          void recorder.stop().catch(() => undefined);
        } catch {
          // The recorder can be released before this cleanup runs.
        }
      }
      void setAudioModeAsync({ allowsRecording: false, playsInSilentMode: true }).catch(
        () => undefined
      );
    };
  }, [clearAutoStopTimer, recorder]);

  const durationMs = recorderState.isRecording
    ? Math.min(recorderState.durationMillis, prototypeConfig.recordingMaxMs)
    : (recording?.durationMs ?? 0);
  const playbackProgress = recording
    ? Math.min(1, playerStatus.currentTime / Math.max(recording.durationMs / 1_000, 0.1))
    : 0;

  return {
    permissionState,
    canAskPermissionAgain,
    isRequestingPermission,
    requestPermission,
    recording,
    isRecording: recorderState.isRecording,
    isPlaying: playerStatus.playing,
    isPlaybackReady: recording !== null && playerStatus.isLoaded && player.isLoaded,
    isBusy,
    durationMs,
    playbackProgress,
    metering: recorderState.metering,
    error,
    startRecording,
    stopRecording: finishRecording,
    togglePlayback,
    resetRecording,
    leaveRecording,
  };
}
