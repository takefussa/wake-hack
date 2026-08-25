import Ionicons from '@expo/vector-icons/Ionicons';
import { Redirect, router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View } from 'react-native';

import { AppButton } from '@/components/common/app-button';
import { AppText } from '@/components/common/app-text';
import { Screen } from '@/components/common/screen';
import { colors, fonts, radii, spacing } from '@/constants/theme';
import { useAppStore } from '@/store/use-app-store';

export default function TomorrowReadyScreen() {
  const currentMorningRequest = useAppStore((state) => state.currentMorningRequest);
  const assignedWakeVoice = useAppStore((state) => state.assignedWakeVoice);

  if (!currentMorningRequest) {
    return <Redirect href="/morning/setup" />;
  }

  const isCommunity = assignedWakeVoice?.type === 'community';

  return (
    <Screen contentStyle={styles.content} testID="tomorrow-ready-screen" variant="dark">
      <StatusBar style="light" />
      <View style={styles.hero}>
        <View style={styles.status}>
          <Ionicons name="checkmark-circle" color={colors.warm} size={20} />
          <AppText variant="caption" tone="lightMuted">
            明日の朝を準備しました
          </AppText>
        </View>
        <AppText variant="caption" tone="lightMuted">
          明日の朝
        </AppText>
        <AppText variant="time" tone="light" style={styles.time}>
          {currentMorningRequest.wakeAt}
        </AppText>
        <View style={styles.divider} />
        <AppText variant="bodyMedium" tone="light" style={styles.readyCopy}>
          {isCommunity
            ? 'みんなに向けて届けられた声で、朝を始めます。'
            : 'あなたに向けた声を準備しました。誰から届くかは朝までのお楽しみです。'}
        </AppText>
      </View>

      <View style={styles.footer}>
        <AppText variant="secondary" tone="lightMuted" style={styles.footerCopy}>
          あとは、ゆっくり休んでください。
        </AppText>
        {isCommunity ? (
          <AppButton
            icon="mic-outline"
            label="誰かに声を届ける"
            onPress={() => router.push('/morning/request-list')}
            variant="inverted"
          />
        ) : null}
        <AppButton
          label="ホームに戻る"
          onPress={() => router.replace('/(tabs)')}
          variant={isCommunity ? 'textOnDark' : 'inverted'}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: 0,
    paddingTop: 0,
  },
  hero: {
    minHeight: 430,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xxxl,
    borderBottomLeftRadius: radii.card,
    borderBottomRightRadius: radii.card,
    backgroundColor: colors.navy,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.lg,
  },
  status: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.xl,
  },
  time: {
    fontFamily: fonts?.rounded,
  },
  divider: {
    width: 48,
    height: 1,
    marginVertical: spacing.sm,
    backgroundColor: colors.navyRaised,
  },
  readyCopy: {
    maxWidth: 280,
    textAlign: 'center',
  },
  footer: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xxl,
    paddingBottom: spacing.xxxl,
    gap: spacing.xl,
  },
  footerCopy: {
    textAlign: 'center',
  },
});
