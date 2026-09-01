import { Image, Pressable, StyleSheet, View } from 'react-native';

import { prototypeConfig } from '@/constants/config';

const RADIO_ASPECT_RATIO = 1080 / 800;

const RADIO_IMAGE = {
  static: require('../../assets/images/radioplayer-static.png'),
  rec: require('../../assets/images/radioplayer-rec.png'),
  play: require('../../assets/images/radioplayer-play.png'),
};

const gaugeColors = {
  fill: '#F2A93B',
  seekRecording: '#E4483A',
  seekPlaying: '#4F9E5C',
};

// Matches the gray tick-mark bars baked into radioplayer-*.png, positioned
// relative to the trackZone overlay so each one can be lit up individually.
// The image alternates tall "major" ticks (every 5th bar) with short ones;
// top/height keep each overlay bar the same size as the gray rectangle it covers.
const TRACK_TALL_BAR = { top: 0, height: 100 };
const TRACK_SHORT_BAR = { top: 25.53, height: 50 };
const TRACK_BAR_SEGMENTS = [
  { left: 0, width: 3.77, ...TRACK_TALL_BAR },
  { left: 5.99, width: 3.99, ...TRACK_SHORT_BAR },
  { left: 12.42, width: 3.99, ...TRACK_SHORT_BAR },
  { left: 18.85, width: 3.99, ...TRACK_SHORT_BAR },
  { left: 25.28, width: 3.99, ...TRACK_SHORT_BAR },
  { left: 31.93, width: 3.99, ...TRACK_TALL_BAR },
  { left: 38.14, width: 3.99, ...TRACK_SHORT_BAR },
  { left: 44.57, width: 3.77, ...TRACK_SHORT_BAR },
  { left: 51.0, width: 3.77, ...TRACK_SHORT_BAR },
  { left: 57.43, width: 3.77, ...TRACK_SHORT_BAR },
  { left: 64.08, width: 3.77, ...TRACK_TALL_BAR },
  { left: 70.29, width: 3.77, ...TRACK_SHORT_BAR },
  { left: 76.72, width: 3.77, ...TRACK_SHORT_BAR },
  { left: 82.93, width: 3.99, ...TRACK_SHORT_BAR },
  { left: 89.36, width: 3.99, ...TRACK_SHORT_BAR },
  { left: 96.23, width: 3.77, ...TRACK_TALL_BAR },
];

type BoomboxRecorderProps = {
  isRecording: boolean;
  hasRecording: boolean;
  isPlaying: boolean;
  playbackProgress: number;
  durationMs: number;
  disabled?: boolean;
  onStart: () => void;
  onStop: () => void;
  onRetake: () => void;
  onTogglePlayback: () => void;
};

export function BoomboxRecorder({
  isRecording,
  hasRecording,
  isPlaying,
  playbackProgress,
  durationMs,
  disabled = false,
  onStart,
  onStop,
  onRetake,
  onTogglePlayback,
}: BoomboxRecorderProps) {
  const radioImageKey = isRecording ? 'rec' : isPlaying ? 'play' : 'static';

  // The orange gauge always reflects how much was recorded, so it stays put
  // (and keeps growing while recording) instead of resetting when playback starts.
  const gaugeFraction =
    isRecording || hasRecording
      ? Math.min(1, Math.max(0, durationMs / prototypeConfig.recordingMaxMs))
      : 0;
  // Played-back position is scaled within the recorded range so the marker
  // never runs ahead of the (fixed) orange gauge while playing.
  const seekFraction = isRecording
    ? gaugeFraction
    : isPlaying
      ? gaugeFraction * Math.min(1, Math.max(0, playbackProgress))
      : null;
  const seekColor = isRecording
    ? gaugeColors.seekRecording
    : isPlaying
      ? gaugeColors.seekPlaying
      : null;
  // Compare each bar's own left edge to the gauge fraction instead of counting
  // by index, so a bar lights up the instant the seek marker reaches it.
  const gaugeThresholdPercent = gaugeFraction * 100;

  function handleRecordPress() {
    if (disabled) return;
    if (isRecording) {
      onStop();
    } else if (hasRecording) {
      onRetake();
    } else {
      onStart();
    }
  }

  function handlePlayPress() {
    if (disabled || !hasRecording) return;
    onTogglePlayback();
  }

  return (
    <View style={styles.wrap}>
      <View style={styles.body}>
        {/* All three artwork states stay mounted (and thus preloaded) at once; only
            opacity toggles, so switching state never has to wait on an image fetch. */}
        {(Object.keys(RADIO_IMAGE) as (keyof typeof RADIO_IMAGE)[]).map((key) => (
          <Image
            key={key}
            resizeMode="contain"
            source={RADIO_IMAGE[key]}
            style={[styles.radioImage, key !== radioImageKey && styles.radioImageHidden]}
          />
        ))}

        <View pointerEvents="none" style={styles.trackZone}>
          {TRACK_BAR_SEGMENTS.map((segment, index) =>
            segment.left <= gaugeThresholdPercent ? (
              <View
                key={index}
                style={[
                  styles.trackBar,
                  {
                    left: `${segment.left}%`,
                    width: `${segment.width}%`,
                    top: `${segment.top}%`,
                    height: `${segment.height}%`,
                  },
                ]}
              />
            ) : null
          )}
          {seekColor && seekFraction !== null ? (
            <View
              style={[
                styles.trackSeek,
                { left: `${seekFraction * 100}%`, backgroundColor: seekColor },
              ]}
            />
          ) : null}
        </View>

        <Pressable
          accessibilityLabel={isRecording ? '録音を停止' : hasRecording ? '録り直す' : '録音を開始'}
          accessibilityRole="button"
          disabled={disabled}
          hitSlop={6}
          onPress={handleRecordPress}
          style={({ pressed }) => [
            styles.hitZone,
            styles.recordZone,
            pressed && !disabled && styles.zonePressed,
          ]}
        />

        <Pressable
          accessibilityLabel={isPlaying ? '一時停止' : '再生する'}
          accessibilityRole="button"
          disabled={disabled || !hasRecording}
          hitSlop={6}
          onPress={handlePlayPress}
          style={({ pressed }) => [
            styles.hitZone,
            styles.playZone,
            pressed && !disabled && hasRecording && styles.zonePressed,
          ]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: '100%',
  },
  body: {
    width: '100%',
    aspectRatio: RADIO_ASPECT_RATIO,
    position: 'relative',
  },
  radioImage: {
    position: 'absolute',
    left: 0,
    top: 0,
    width: '100%',
    height: '100%',
  },
  radioImageHidden: {
    opacity: 0,
  },
  trackZone: {
    position: 'absolute',
    left: '47.78%',
    top: '37.75%',
    width: '41.76%',
    height: '11.75%',
  },
  trackBar: {
    position: 'absolute',
    backgroundColor: gaugeColors.fill,
  },
  trackSeek: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 4,
    marginLeft: -2,
  },
  hitZone: {
    position: 'absolute',
    top: '26.5%',
    height: '23.5%',
    width: '10.2%',
    borderRadius: 8,
  },
  recordZone: {
    left: '9.8%',
  },
  playZone: {
    left: '23.6%',
  },
  zonePressed: {
    backgroundColor: 'rgba(0, 0, 0, 0.12)',
  },
});
