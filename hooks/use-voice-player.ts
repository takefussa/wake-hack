import { setAudioModeAsync, useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { resolveVoiceSource } from '@/features/voice/resolve-voice-source';
import type { VoiceMessage } from '@/types';

export function useVoicePlayer(voice: VoiceMessage, autoPlay = false) {
  const source = useMemo(
    () => resolveVoiceSource(voice),
    [voice.id, voice.type, voice.uri]
  );
  const player = useAudioPlayer(source, { updateInterval: 100 });
  const status = useAudioPlayerStatus(player);
  const [error, setError] = useState<string | null>(null);
  const autoPlayAttempted = useRef(false);

  const play = useCallback(async () => {
    setError(null);

    try {
      if (!player.isLoaded) {
        setError('声を準備しています。少し待ってからお試しください。');
        return;
      }

      await setAudioModeAsync({ allowsRecording: false, playsInSilentMode: true });
      if (
        status.didJustFinish ||
        status.currentTime >= Math.max(0, status.duration - 0.05)
      ) {
        await player.seekTo(0);
      }
      player.play();
    } catch {
      setError('声を再生できませんでした。もう一度お試しください。');
    }
  }, [player, status.currentTime, status.didJustFinish, status.duration]);

  const togglePlayback = useCallback(async () => {
    if (status.playing) {
      try {
        player.pause();
      } catch {
        setError('再生を停止できませんでした。');
      }
      return;
    }
    await play();
  }, [play, player, status.playing]);

  const stopPlayback = useCallback(() => {
    try {
      if (player.playing) {
        player.pause();
      }
    } catch {
      // The managed player may already be released during navigation.
    }
  }, [player]);

  useEffect(() => {
    if (!autoPlay || autoPlayAttempted.current || !status.isLoaded) return;
    autoPlayAttempted.current = true;
    void play();
  }, [autoPlay, play, status.isLoaded]);

  const fallbackDurationSeconds = voice.durationMs / 1_000;
  const durationSeconds =
    Number.isFinite(status.duration) && status.duration > 0
      ? status.duration
      : fallbackDurationSeconds;

  return {
    isPlaying: status.playing,
    isReady: status.isLoaded && player.isLoaded,
    progress: Math.min(1, status.currentTime / Math.max(durationSeconds, 0.1)),
    currentTimeSeconds: status.currentTime,
    durationSeconds,
    error,
    togglePlayback,
    stopPlayback,
  };
}
