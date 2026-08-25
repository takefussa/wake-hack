import { StyleSheet, View } from 'react-native';

import { colors, radii, spacing } from '@/constants/theme';

const defaultLevels = [8, 18, 28, 14, 34, 42, 22, 12, 36, 48, 30, 18, 40, 26, 14, 32, 20];

type WaveformProps = {
  color?: string;
  mutedColor?: string;
  progress?: number;
  height?: number;
  levels?: number[];
};

export function Waveform({
  color = colors.indigo,
  mutedColor = colors.border,
  progress = 1,
  height = 52,
  levels = defaultLevels,
}: WaveformProps) {
  const playedCount = Math.round(levels.length * Math.min(Math.max(progress, 0), 1));

  return (
    <View accessibilityLabel="音声波形" style={[styles.waveform, { height }]}>
      {levels.map((level, index) => (
        <View
          key={`${level}-${index}`}
          style={[
            styles.bar,
            {
              height: Math.min(level, height),
              backgroundColor: index < playedCount ? color : mutedColor,
            },
          ]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  waveform: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.xs,
  },
  bar: {
    flex: 1,
    maxWidth: 4,
    minHeight: 4,
    borderRadius: radii.badge,
  },
});
