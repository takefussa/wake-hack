import { useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import { useCallback, useEffect, useRef, useState } from 'react';

import { prototypeConfig } from '@/constants/config';
import { demoRecordingUri } from '@/features/demo/demo-recording';

import type { LocalVoiceRecording, MicrophonePermissionState } from './use-voice-recorder';

/**
 * The judge-facing web demo never touches MediaRecorder: browsers disagree on
 * container support and Chrome's WebM omits the duration metadata the send
 * flow validates against, so a blocked or malformed take would strand the
 * demo. The recorder is simulated instead, and the take plays back a bundled
 * voice so the screen still behaves like the device build.
 */
const demoRecordingSource = require('../assets/audio/onboarding-takuma.wav') as number;
const tickIntervalMs = 100;

export type { LocalVoiceRecording, MicrophonePermissionState };

export function useVoiceRecorder() {
  const [recording, setRecording] = useState<LocalVoiceRecording | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [durationMs, setDurationMs] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const player = useAudioPlayer(demoRecordingSource, { updateInterval: 100 });
  const playerStatus = useAudioPlayerStatus(player);
  const tickTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const elapsedMs = useRef(0);
  const isRecordingRef = useRef(false);

  const clearTickTimer = useCallback(() => {
    if (tickTimer.current) {
      clearInterval(tickTimer.current);
      tickTimer.current = null;
    }
  }, []);

  const stopRecording = useCallback(async () => {
    if (!isRecordingRef.current) return;

    clearTickTimer();
    isRecordingRef.current = false;
    setIsRecording(false);
    setRecording({
      uri: demoRecordingUri,
      // A take shorter than the minimum is rounded up rather than rejected, so
      // an impatient tap never dead-ends the demo on the send screen.
      durationMs: Math.min(
        prototypeConfig.recordingMaxMs,
        Math.max(prototypeConfig.recordingMinMs, elapsedMs.current)
      ),
    });
  }, [clearTickTimer]);

  const startRecording = useCallback(async () => {
    if (isRecording) return;

    try {
      player.pause();
    } catch {
      // A fresh take stays available even when the player has nothing loaded.
    }
    setError(null);
    setRecording(null);
    elapsedMs.current = 0;
    setDurationMs(0);
    isRecordingRef.current = true;
    setIsRecording(true);
    clearTickTimer();
    tickTimer.current = setInterval(() => {
      elapsedMs.current += tickIntervalMs;
      setDurationMs(elapsedMs.current);
      if (elapsedMs.current >= prototypeConfig.recordingMaxMs) {
        void stopRecording();
      }
    }, tickIntervalMs);
  }, [clearTickTimer, isRecording, player, stopRecording]);

  const togglePlayback = useCallback(async () => {
    if (!recording) return;
    setError(null);

    try {
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
  }, [player, playerStatus, recording]);

  const resetRecording = useCallback(() => {
    try {
      player.pause();
    } catch {
      // Reset stays available even when the player has already stopped.
    }
    clearTickTimer();
    elapsedMs.current = 0;
    isRecordingRef.current = false;
    setDurationMs(0);
    setRecording(null);
    setIsRecording(false);
    setError(null);
  }, [clearTickTimer, player]);

  const leaveRecording = useCallback(async () => {
    clearTickTimer();
    try {
      player.pause();
    } catch {
      // The player may already be released while navigation completes.
    }
    isRecordingRef.current = false;
    setIsRecording(false);
  }, [clearTickTimer, player]);

  useEffect(() => clearTickTimer, [clearTickTimer]);

  return {
    permissionState: 'granted' as MicrophonePermissionState,
    canAskPermissionAgain: true,
    isRequestingPermission: false,
    requestPermission: async () => true,
    recording,
    isRecording,
    isPlaying: playerStatus.playing,
    isPlaybackReady: recording !== null && playerStatus.isLoaded,
    isBusy: false,
    durationMs: isRecording ? durationMs : (recording?.durationMs ?? 0),
    playbackProgress: recording
      ? Math.min(
          1,
          playerStatus.currentTime / Math.max(recording.durationMs / 1_000, 0.1)
        )
      : 0,
    metering: undefined,
    error,
    startRecording,
    stopRecording,
    togglePlayback,
    resetRecording,
    leaveRecording,
  };
}
