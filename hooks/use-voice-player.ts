import { setAudioModeAsync, useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { resolveVoiceSource } from '@/features/voice/resolve-voice-source';
import type { VoiceMessage } from '@/types';

type VoicePlayerOptions = {
  downloadFirst?: boolean;
};

export function useVoicePlayer(
  voice: VoiceMessage,
  autoPlay = false,
  options: VoicePlayerOptions = {}
) {
  const source = useMemo(
    () => resolveVoiceSource(voice),
    [voice.id, voice.type, voice.uri]
  );
  const player = useAudioPlayer(source, {
    updateInterval: 100,
    downloadFirst: options.downloadFirst ?? false,
  });
  const status = useAudioPlayerStatus(player);
  const [error, setError] = useState<string | null>(null);
  const [loadAttempt, setLoadAttempt] = useState(0);
  const autoPlayAttempted = useRef(false);

  // AVPlayer can remain in `unknown` when a signed URL has expired or the
  // network is unavailable. Without a timeout the UI would show a spinner
  // forever, so turn that state into a recoverable error instead.
  useEffect(() => {
    setError(null);
    autoPlayAttempted.current = false;

    if (source === null) {
      setError('ボイメの音声データがありません。');
      return;
    }

    const timeout = setTimeout(() => {
      if (!player.isLoaded) {
        setError('ボイメを読み込めませんでした。再試行してください。');
      }
    }, 12_000);

    return () => clearTimeout(timeout);
  }, [loadAttempt, player, source]);

  useEffect(() => {
    if (status.playbackState === 'failed') {
      setError('ボイメを読み込めませんでした。再試行してください。');
    }
  }, [status.playbackState]);

  const retry = useCallback(() => {
    if (source === null) {
      setError('ボイメの音声データがありません。');
      return;
    }

    setError(null);
    autoPlayAttempted.current = false;
    setLoadAttempt((attempt) => attempt + 1);
    try {
      player.replace(source);
    } catch {
      setError('ボイメを読み込めませんでした。再試行してください。');
    }
  }, [player, source]);

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
    // `player.isLoaded` is the native source of truth. On iOS the status
    // event can lag behind it, which previously left playable received voices
    // permanently shown as "preparing".
    isReady: player.isLoaded,
    progress: Math.min(1, status.currentTime / Math.max(durationSeconds, 0.1)),
    currentTimeSeconds: status.currentTime,
    durationSeconds,
    error,
    retry,
    togglePlayback,
    stopPlayback,
  };
}
