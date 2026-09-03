import Ionicons from '@expo/vector-icons/Ionicons';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { AppText } from '@/components/common/app-text';
import { colors, paperColors, shadows, spacing } from '@/constants/theme';

type VoiceExampleCardProps = {
  error: boolean;
  isLoading: boolean;
  lines: string[] | null;
  onRegenerate: () => void;
};

function GeminiMark() {
  return (
    <View accessibilityLabel="Gemini" style={styles.geminiMark}>
      <Text style={[styles.geminiGlyph, styles.geminiBlue]}>✦</Text>
      <View pointerEvents="none" style={styles.geminiPinkHalf}>
        <Text style={[styles.geminiGlyph, styles.geminiPink]}>✦</Text>
      </View>
    </View>
  );
}

export function VoiceExampleCard({
  error,
  isLoading,
  lines,
  onRegenerate,
}: VoiceExampleCardProps) {
  return (
    <View style={styles.card}>
      <View pointerEvents="none" style={styles.tape} />
      <View style={styles.header}>
        <View style={styles.labelRow}>
          <GeminiMark />
          <AppText variant="bodyMedium">声かけの例</AppText>
        </View>
        <Pressable
          accessibilityLabel={lines ? '別の例文を作る' : '例文をもう一度作る'}
          accessibilityRole="button"
          disabled={isLoading}
          hitSlop={8}
          onPress={onRegenerate}
          style={({ pressed }) => [styles.retry, pressed && styles.pressed]}>
          <Ionicons color={paperColors.ink} name="refresh-outline" size={16} />
          <AppText style={styles.retryText}>{lines ? '別の例文' : '再試行'}</AppText>
        </Pressable>
      </View>

      {isLoading ? (
        <View style={styles.loading}>
          <ActivityIndicator color={paperColors.orange} size="small" />
          <AppText variant="secondary" tone="soft">例文を考えています…</AppText>
        </View>
      ) : lines ? (
        <View style={styles.example}>
          {lines.map((line) => (
            <AppText key={line} style={styles.exampleText}>{line}</AppText>
          ))}
        </View>
      ) : error ? (
        <AppText variant="secondary" tone="soft" style={styles.errorText}>
          例文を作れませんでした。もう一度お試しください。
        </AppText>
      ) : null}

      <AppText variant="caption" tone="muted">
        そのまま読んでも、あなたの言葉に変えてもOKです。
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    position: 'relative',
    padding: spacing.lg,
    gap: spacing.md,
    borderWidth: 2,
    borderColor: paperColors.ink,
    borderRadius: 18,
    backgroundColor: paperColors.paleYellow,
    ...shadows.paper,
  },
  tape: {
    position: 'absolute',
    top: -11,
    left: 34,
    width: 72,
    height: 21,
    backgroundColor: paperColors.tape,
    opacity: 0.86,
    transform: [{ rotate: '-1deg' }],
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  geminiMark: {
    position: 'relative',
    width: 24,
    height: 27,
  },
  geminiGlyph: {
    position: 'absolute',
    top: -3,
    left: 0,
    width: 24,
    fontSize: 27,
    lineHeight: 30,
    textAlign: 'center',
  },
  geminiBlue: {
    color: '#4A8DF6',
  },
  geminiPinkHalf: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 12,
    height: 27,
    overflow: 'hidden',
  },
  geminiPink: {
    left: -12,
    color: '#D96AB4',
  },
  retry: {
    minHeight: 34,
    paddingHorizontal: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    borderWidth: 1.5,
    borderColor: paperColors.ink,
    borderRadius: 10,
    backgroundColor: paperColors.base,
  },
  retryText: {
    color: paperColors.ink,
    fontSize: 12,
    lineHeight: 17,
  },
  pressed: {
    opacity: 0.65,
  },
  loading: {
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  example: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: spacing.xs,
    borderLeftWidth: 4,
    borderLeftColor: paperColors.orange,
    backgroundColor: paperColors.base,
  },
  exampleText: {
    color: paperColors.ink,
    fontSize: 16,
    lineHeight: 24,
  },
  errorText: {
    minHeight: 52,
    textAlign: 'center',
    textAlignVertical: 'center',
    color: colors.danger,
  },
});
