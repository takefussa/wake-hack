import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/common/app-text';
import { Avatar } from '@/components/common/avatar';
import { VoicePreview } from '@/components/common/voice-preview';
import { Waveform } from '@/components/common/waveform';
import { colors, componentSizes, spacing } from '@/constants/theme';
import type { OnboardingSceneType } from '@/data/onboarding-pages';
import { mockOnboardingVoice } from '@/data/mock-voices';

type OnboardingSceneProps = {
  scene: OnboardingSceneType;
};

function Person({ avatarId, name }: { avatarId: 'luna' | 'sky' | 'ember'; name: string }) {
  return (
    <View style={styles.person}>
      <Avatar avatarId={avatarId} name={name} size={56} />
      <AppText variant="caption" tone="lightMuted">
        {name}
      </AppText>
    </View>
  );
}

export function OnboardingScene({ scene }: OnboardingSceneProps) {
  if (scene === 'receive') {
    return (
      <View style={styles.stage}>
        <View style={styles.morningTime}>
          <AppText variant="caption" tone="lightMuted">
            明日の朝
          </AppText>
          <AppText variant="displayNumber" tone="light">
            07:00
          </AppText>
        </View>
        <VoicePreview
          avatarId="sky"
          mode="dark"
          name="Takuma"
          voice={mockOnboardingVoice}
        />
      </View>
    );
  }

  if (scene === 'give') {
    return (
      <View style={styles.stage}>
        <View style={styles.peopleRow}>
          <Person avatarId="luna" name="あなた" />
          <View style={styles.voiceBridge}>
            <Waveform
              color={colors.warm}
              height={32}
              levels={[6, 14, 24, 11, 20, 8, 16]}
            />
            <View style={styles.mic}>
              <Ionicons name="mic-outline" size={20} color={colors.navy} />
            </View>
          </View>
          <Person avatarId="ember" name="Takumi" />
        </View>
        <AppText variant="secondary" tone="lightMuted" style={styles.centerText}>
          明日は発表。背中を押してほしい。
        </AppText>
      </View>
    );
  }

  return (
    <View style={[styles.stage, styles.connectionStage]}>
      <View style={styles.avatarLine} />
      <View style={styles.avatarGroup}>
        <Avatar avatarId="sky" name="Takuma" size={componentSizes.avatarLarge} />
        <Avatar avatarId="luna" name="あなた" size={componentSizes.avatarLarge} />
        <Avatar avatarId="mint" name="Haruka" size={componentSizes.avatarLarge} />
      </View>
      <AppText variant="secondary" tone="lightMuted" style={styles.centerText}>
        名前を知らなくても、声の向こうに人がいる。
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  stage: {
    minHeight: 240,
    justifyContent: 'center',
    gap: spacing.xxl,
  },
  morningTime: {
    gap: spacing.xs,
  },
  peopleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.lg,
  },
  person: {
    width: 72,
    alignItems: 'center',
    gap: spacing.sm,
  },
  voiceBridge: {
    flex: 1,
    alignItems: 'center',
    gap: spacing.md,
  },
  mic: {
    width: componentSizes.touchTarget,
    height: componentSizes.touchTarget,
    borderRadius: componentSizes.touchTarget / 2,
    backgroundColor: colors.warm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerText: {
    textAlign: 'center',
  },
  connectionStage: {
    position: 'relative',
    alignItems: 'center',
  },
  avatarLine: {
    position: 'absolute',
    top: 100,
    left: 52,
    right: 52,
    height: 1,
    backgroundColor: colors.navyRaised,
  },
  avatarGroup: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
});
