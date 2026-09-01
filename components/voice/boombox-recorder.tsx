import Ionicons from '@expo/vector-icons/Ionicons';
import { useEffect, useMemo, useRef } from 'react';
import { Animated, Easing, Pressable, StyleSheet, Text, View } from 'react-native';

import { prototypeConfig } from '@/constants/config';
import { fonts } from '@/constants/theme';

const BAR_COUNT = 28;
const BASE_BAR_HEIGHT = 6;
const MAX_BAR_HEIGHT = 26;

const boomboxColors = {
  body: '#E08A3E',
  outline: '#20140B',
  track: '#F3E8D7',
  barIdle: '#D9C6A8',
  barFilled: '#D59B45',
  barLive: '#E4483A',
  recIdle: '#D6453A',
  recActive: '#E4483A',
  recBezel: '#20140B',
  playActive: '#4F7864',
  playDisabled: '#9AA0A6',
  speakerOuter: '#202A3E',
  speakerInner: '#172033',
  speakerHighlight: '#3E4657',
  cassette: '#B5622A',
  reel: '#F3E8D7',
  hintText: '#66707C',
  hintArrow: '#D59B45',
};

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
  const levelsRef = useRef<number[]>(
    Array.from({ length: BAR_COUNT }, () => BASE_BAR_HEIGHT)
  );
  const wasRecordingRef = useRef(false);
  const bounceAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  if (isRecording && !wasRecordingRef.current) {
    levelsRef.current = Array.from(
      { length: BAR_COUNT },
      () => BASE_BAR_HEIGHT + Math.random() * (MAX_BAR_HEIGHT - BASE_BAR_HEIGHT)
    );
  }
  wasRecordingRef.current = isRecording;

  // While a retake handoff is in flight (reset -> immediate start), `disabled` (isBusy)
  // is already true before `hasRecording` catches up, so this keeps the idle hint from
  // flashing between the two.
  const showHint = !isRecording && !hasRecording && !disabled;

  useEffect(() => {
    if (!showHint) return;

    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(bounceAnim, {
          toValue: 1,
          duration: 550,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(bounceAnim, {
          toValue: 0,
          duration: 550,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [bounceAnim, showHint]);

  useEffect(() => {
    if (!isRecording) {
      pulseAnim.setValue(1);
      return;
    }

    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 0.55,
          duration: 500,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 500,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [isRecording, pulseAnim]);

  const visibleCount = Math.min(
    BAR_COUNT,
    Math.round((durationMs / prototypeConfig.recordingMaxMs) * BAR_COUNT)
  );

  // levelsRef holds the per-bar random heights rolled at record start; this recomputes
  // which of them are revealed as durationMs (via visibleCount) advances.
  const bars = useMemo(
    () =>
      levelsRef.current.map((level, index) => {
        const isVisible = index < visibleCount;
        const isLeadingEdge = isRecording && index === visibleCount - 1;
        return {
          height: isVisible ? level : BASE_BAR_HEIGHT / 2,
          color: isLeadingEdge
            ? boomboxColors.barLive
            : isVisible
              ? boomboxColors.barFilled
              : boomboxColors.barIdle,
        };
      }),
    [visibleCount, isRecording]
  );

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
        <View style={styles.cabinet} />

        <View style={styles.antennaMount} />
        <View style={styles.antennaLine} />
        <View style={styles.antennaTip} />

        <View style={styles.track}>
          {bars.map((bar, index) => (
            <View
              key={index}
              style={[styles.bar, { height: bar.height, backgroundColor: bar.color }]}
            />
          ))}
          {isPlaying ? (
            <View
              pointerEvents="none"
              style={[
                styles.playbackIndicator,
                { left: `${Math.min(100, Math.max(0, playbackProgress * 100))}%` },
              ]}
            />
          ) : null}
        </View>

        <View style={styles.recordBezel}>
          <Pressable
            accessibilityLabel={isRecording ? '録音を停止' : hasRecording ? '録り直す' : '録音を開始'}
            accessibilityRole="button"
            disabled={disabled}
            hitSlop={4}
            onPress={handleRecordPress}
            style={({ pressed }) => [styles.recordButtonZone, pressed && styles.recordPressed]}>
            <Animated.View
              style={[
                styles.recordButton,
                {
                  backgroundColor: isRecording ? boomboxColors.recActive : boomboxColors.recIdle,
                  opacity: pulseAnim,
                },
              ]}>
              <Ionicons color="#FCFCFA" name={isRecording ? 'stop' : 'mic'} size={20} />
            </Animated.View>
          </Pressable>
        </View>

        <View style={styles.playBezel}>
          <Pressable
            accessibilityLabel={isPlaying ? '一時停止' : '再生する'}
            accessibilityRole="button"
            disabled={disabled || !hasRecording}
            hitSlop={4}
            onPress={handlePlayPress}
            style={({ pressed }) => [
              styles.recordButtonZone,
              pressed && hasRecording && styles.recordPressed,
            ]}>
            <View
              style={[
                styles.recordButton,
                {
                  backgroundColor: hasRecording
                    ? boomboxColors.playActive
                    : boomboxColors.playDisabled,
                },
              ]}>
              <Ionicons color="#FCFCFA" name={isPlaying ? 'pause' : 'play'} size={20} />
            </View>
          </Pressable>
        </View>

        {showHint ? (
          <View pointerEvents="none" style={styles.hint}>
            <Text style={styles.hintText}>録音を開始</Text>
            <Animated.View
              style={{
                transform: [
                  {
                    translateY: bounceAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, 10],
                    }),
                  },
                ],
              }}>
              <Ionicons color={boomboxColors.hintArrow} name="arrow-down" size={30} />
            </Animated.View>
          </View>
        ) : null}

        {!isRecording && hasRecording ? (
          <>
            <View pointerEvents="none" style={styles.retakeLabel}>
              <Text style={styles.hintText}>録り直す</Text>
            </View>
            <View pointerEvents="none" style={styles.playLabel}>
              <Text style={[styles.hintText, styles.hintTextActive]}>再生する</Text>
            </View>
          </>
        ) : null}

        <View style={[styles.speaker, styles.speakerLeft]}>
          <View style={styles.speakerInner} />
          <View style={styles.speakerHighlight} />
        </View>
        <View style={[styles.speaker, styles.speakerRight]}>
          <View style={styles.speakerInner} />
          <View style={styles.speakerHighlight} />
        </View>

        <View style={styles.cassette}>
          <View style={[styles.reel, styles.reelLeft]}>
            <View style={styles.reelDot} />
          </View>
          <View style={[styles.reel, styles.reelRight]}>
            <View style={styles.reelDot} />
          </View>
          <View style={styles.cassetteWindow} />
        </View>

        <View style={styles.bottomBezel}>
          <View style={styles.bezelDot} />
          <View style={styles.bezelDot} />
          <View style={styles.bezelDot} />
        </View>
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
    aspectRatio: 720 / 640,
    position: 'relative',
  },
  cabinet: {
    position: 'absolute',
    left: '5.56%',
    top: '29.69%',
    width: '88.89%',
    height: '64.06%',
    borderRadius: 28,
    borderWidth: 8,
    borderColor: boomboxColors.outline,
    backgroundColor: boomboxColors.body,
  },

  antennaMount: {
    position: 'absolute',
    left: '81.11%',
    top: '28.13%',
    width: '4.44%',
    height: '5%',
    borderRadius: 999,
    backgroundColor: boomboxColors.outline,
  },
  antennaLine: {
    position: 'absolute',
    left: '83.33%',
    top: '30.6%',
    width: '39.65%',
    height: 4,
    backgroundColor: boomboxColors.outline,
    transformOrigin: '0% 50%',
    transform: [{ rotate: '-140.4deg' }],
  },
  antennaTip: {
    position: 'absolute',
    left: '51.67%',
    top: '0.94%',
    width: '2.22%',
    height: '2.5%',
    borderRadius: 999,
    backgroundColor: boomboxColors.outline,
  },

  track: {
    position: 'absolute',
    left: '9.72%',
    top: '45.94%',
    width: '80.56%',
    height: '10%',
    borderRadius: 999,
    borderWidth: 6,
    borderColor: boomboxColors.outline,
    backgroundColor: boomboxColors.track,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
    overflow: 'hidden',
  },
  bar: {
    width: 3,
    borderRadius: 2,
  },
  playbackIndicator: {
    position: 'absolute',
    top: 3,
    bottom: 3,
    width: 3,
    borderRadius: 2,
    backgroundColor: boomboxColors.playActive,
    transform: [{ translateX: -1.5 }],
  },

  recordBezel: {
    position: 'absolute',
    left: '15%',
    top: '26%',
    width: '16%',
    height: '18%',
    borderRadius: 14,
    backgroundColor: boomboxColors.recBezel,
    borderWidth: 4,
    borderColor: boomboxColors.outline,
  },
  playBezel: {
    position: 'absolute',
    left: '34%',
    top: '26%',
    width: '16%',
    height: '18%',
    borderRadius: 14,
    backgroundColor: boomboxColors.recBezel,
    borderWidth: 4,
    borderColor: boomboxColors.outline,
  },
  recordButtonZone: {
    position: 'absolute',
    top: 4,
    left: 4,
    right: 4,
    bottom: 4,
  },
  recordPressed: {
    opacity: 0.85,
  },
  recordButton: {
    flex: 1,
    borderRadius: 10,
    borderWidth: 4,
    borderColor: boomboxColors.outline,
    alignItems: 'center',
    justifyContent: 'center',
  },

  hint: {
    position: 'absolute',
    left: '3%',
    top: '2%',
    width: '40%',
    alignItems: 'center',
    gap: 4,
  },
  retakeLabel: {
    position: 'absolute',
    left: '10.5%',
    top: '16%',
    width: '25%',
    alignItems: 'center',
  },
  playLabel: {
    position: 'absolute',
    left: '29.5%',
    top: '16%',
    width: '25%',
    alignItems: 'center',
  },
  hintText: {
    fontFamily: fonts?.sans,
    fontSize: 13,
    fontWeight: '600',
    color: boomboxColors.hintText,
    textAlign: 'center',
  },
  hintTextActive: {
    color: boomboxColors.playActive,
  },

  speaker: {
    position: 'absolute',
    top: '55.16%',
    width: '26.39%',
    height: '29.69%',
    borderRadius: 999,
    borderWidth: 8,
    borderColor: boomboxColors.outline,
    backgroundColor: boomboxColors.speakerOuter,
    alignItems: 'center',
    justifyContent: 'center',
  },
  speakerLeft: {
    left: '7.64%',
  },
  speakerRight: {
    left: '65.97%',
  },
  speakerInner: {
    position: 'absolute',
    left: '16.3%',
    top: '16.3%',
    right: '16.3%',
    bottom: '16.3%',
    borderRadius: 999,
    backgroundColor: boomboxColors.speakerInner,
  },
  speakerHighlight: {
    position: 'absolute',
    left: '20%',
    top: '20%',
    width: 12,
    height: 12,
    borderRadius: 999,
    backgroundColor: boomboxColors.speakerHighlight,
  },

  cassette: {
    position: 'absolute',
    left: '37.5%',
    top: '61.875%',
    width: '25%',
    height: '16.25%',
    borderRadius: 10,
    borderWidth: 6,
    borderColor: boomboxColors.outline,
    backgroundColor: boomboxColors.cassette,
  },
  reel: {
    position: 'absolute',
    top: '30.77%',
    width: '22.22%',
    height: '38.46%',
    borderRadius: 999,
    borderWidth: 5,
    borderColor: boomboxColors.outline,
    backgroundColor: boomboxColors.reel,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reelLeft: {
    left: '11.11%',
  },
  reelRight: {
    left: '66.67%',
  },
  reelDot: {
    width: 6,
    height: 6,
    borderRadius: 999,
    backgroundColor: boomboxColors.outline,
  },
  cassetteWindow: {
    position: 'absolute',
    left: '41.67%',
    top: '38.46%',
    width: '16.67%',
    height: '23.08%',
    borderRadius: 4,
    backgroundColor: boomboxColors.outline,
  },

  bottomBezel: {
    position: 'absolute',
    left: '11.94%',
    top: '86.875%',
    width: '76.11%',
    height: '4.06%',
    borderRadius: 999,
    backgroundColor: boomboxColors.outline,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  bezelDot: {
    width: 6,
    height: 6,
    borderRadius: 999,
    backgroundColor: boomboxColors.track,
  },
});
