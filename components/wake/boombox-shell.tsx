import * as Haptics from 'expo-haptics';
import type { PropsWithChildren } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/common/app-text';
import { boombox, colors, radii, shadows, spacing } from '@/constants/theme';

type BoomboxButtonSpec = {
  label: string;
  sublabel?: string;
  onPress: () => void;
  disabled?: boolean;
  testID?: string;
};

type BoomboxShellProps = PropsWithChildren<{
  cassetteLabel: string;
  isRecording?: boolean;
  primaryButton: BoomboxButtonSpec;
  secondaryButton: BoomboxButtonSpec;
  testID?: string;
}>;

function DeckButton({
  label,
  sublabel,
  onPress,
  disabled,
  tone,
  testID,
}: BoomboxButtonSpec & { tone: 'primary' | 'secondary' }) {
  function handlePressIn() {
    if (disabled) return;
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  }

  return (
    <Pressable
      accessibilityLabel={sublabel ? `${label} ${sublabel}` : label}
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      onPressIn={handlePressIn}
      testID={testID}
      style={({ pressed }) => [
        styles.deckButton,
        tone === 'primary' ? styles.deckButtonPrimary : styles.deckButtonSecondary,
        disabled && styles.deckButtonDisabled,
        pressed &&
          !disabled &&
          (tone === 'primary' ? styles.deckButtonPrimaryPressed : styles.deckButtonSecondaryPressed),
      ]}>
      <AppText style={styles.deckButtonLabel} variant="bodyMedium">
        {label}
      </AppText>
      {sublabel ? (
        <AppText style={styles.deckButtonSublabel} variant="caption">
          {sublabel}
        </AppText>
      ) : null}
    </Pressable>
  );
}

function SpeakerGrille() {
  return (
    <View style={styles.speaker}>
      <View style={styles.speakerRingOuter} />
      <View style={styles.speakerRingInner} />
      <View style={styles.speakerCore} />
    </View>
  );
}

function CassetteWindow({ label, isRecording }: { label: string; isRecording: boolean }) {
  return (
    <View style={styles.cassette}>
      <View style={styles.cassetteTopRow}>
        <View style={[styles.recDot, isRecording && styles.recDotActive]} />
        <AppText style={styles.recText} variant="caption">
          REC
        </AppText>
      </View>
      <View style={styles.reelsRow}>
        <View style={styles.reel}>
          <View style={styles.reelHub} />
        </View>
        <View style={styles.reel}>
          <View style={styles.reelHub} />
        </View>
      </View>
      <AppText numberOfLines={1} style={styles.cassetteLabel} variant="caption">
        {label}
      </AppText>
    </View>
  );
}

export function BoomboxShell({
  children,
  cassetteLabel,
  isRecording = false,
  primaryButton,
  secondaryButton,
  testID,
}: BoomboxShellProps) {
  return (
    <View style={styles.body} testID={testID}>
      <View style={styles.topKnob} />

      <View style={styles.screenCard}>{children}</View>

      <View style={styles.buttonRow}>
        <DeckButton tone="primary" {...primaryButton} />
        <View style={styles.buttonDivider} />
        <DeckButton tone="secondary" {...secondaryButton} />
      </View>

      <View style={styles.deck}>
        <SpeakerGrille />
        <CassetteWindow isRecording={isRecording} label={cassetteLabel} />
        <SpeakerGrille />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  body: {
    borderRadius: radii.card + 16,
    backgroundColor: boombox.body,
    padding: spacing.lg,
    gap: spacing.md,
    ...shadows.surface,
  },
  topKnob: {
    width: 28,
    height: 10,
    borderRadius: radii.badge,
    backgroundColor: boombox.bodyDarkest,
    alignSelf: 'center',
  },
  screenCard: {
    borderRadius: radii.card + 8,
    borderWidth: 2,
    borderColor: boombox.screenBorder,
    backgroundColor: colors.surface,
    padding: spacing.xl,
    gap: spacing.lg,
  },
  buttonRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: 3,
  },
  buttonDivider: {
    width: 3,
    borderRadius: radii.badge,
    backgroundColor: boombox.bodyDarkest,
  },
  deckButton: {
    flex: 1,
    minHeight: 64,
    borderRadius: radii.button,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    borderTopWidth: 2,
    borderBottomWidth: 3,
  },
  deckButtonPrimary: {
    backgroundColor: boombox.buttonPrimary,
    borderTopColor: '#F4C3BC',
    borderBottomColor: boombox.buttonPrimaryPressed,
  },
  deckButtonSecondary: {
    backgroundColor: boombox.buttonSecondary,
    borderTopColor: '#D3E4F3',
    borderBottomColor: boombox.buttonSecondaryPressed,
  },
  deckButtonPrimaryPressed: {
    backgroundColor: boombox.buttonPrimaryPressed,
    transform: [{ translateY: 2 }],
  },
  deckButtonSecondaryPressed: {
    backgroundColor: boombox.buttonSecondaryPressed,
    transform: [{ translateY: 2 }],
  },
  deckButtonDisabled: {
    opacity: 0.45,
  },
  deckButtonSublabel: {
    color: colors.navy,
    opacity: 0.72,
  },
  deckButtonLabel: {
    color: colors.navy,
  },
  deck: {
    borderRadius: radii.card,
    backgroundColor: boombox.deck,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  speaker: {
    width: 56,
    height: 56,
    borderRadius: radii.avatar,
    backgroundColor: boombox.grille,
    alignItems: 'center',
    justifyContent: 'center',
  },
  speakerRingOuter: {
    position: 'absolute',
    width: 44,
    height: 44,
    borderRadius: radii.avatar,
    borderWidth: 1,
    borderColor: boombox.grilleLine,
  },
  speakerRingInner: {
    position: 'absolute',
    width: 28,
    height: 28,
    borderRadius: radii.avatar,
    borderWidth: 1,
    borderColor: boombox.grilleLine,
  },
  speakerCore: {
    width: 8,
    height: 8,
    borderRadius: radii.avatar,
    backgroundColor: boombox.bodyDarkest,
  },
  cassette: {
    flex: 1,
    maxWidth: 180,
    borderRadius: radii.input,
    backgroundColor: boombox.cassetteWindow,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    alignItems: 'center',
    gap: spacing.xs,
  },
  cassetteTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    alignSelf: 'flex-start',
  },
  recDot: {
    width: 8,
    height: 8,
    borderRadius: radii.avatar,
    backgroundColor: boombox.recIdle,
  },
  recDotActive: {
    backgroundColor: boombox.rec,
  },
  recText: {
    color: boombox.bodyDark,
    letterSpacing: 1,
  },
  reelsRow: {
    flexDirection: 'row',
    gap: spacing.xl,
  },
  reel: {
    width: 26,
    height: 26,
    borderRadius: radii.avatar,
    borderWidth: 2,
    borderColor: boombox.reel,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reelHub: {
    width: 6,
    height: 6,
    borderRadius: radii.avatar,
    backgroundColor: boombox.reel,
  },
  cassetteLabel: {
    color: boombox.bodyDark,
  },
});
