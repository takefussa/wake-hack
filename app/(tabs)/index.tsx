import { Redirect, router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { AppLogo } from '@/components/common/app-logo';
import { AppText } from '@/components/common/app-text';
import { Avatar } from '@/components/common/avatar';
import { Screen } from '@/components/common/screen';
import { Waveform } from '@/components/common/waveform';
import { NextMorningCard } from '@/components/home/next-morning-card';
import { colors, spacing } from '@/constants/theme';
import { useAppStore } from '@/store/use-app-store';

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 11) return 'おはようございます';
  if (hour < 18) return 'こんにちは';
  return 'こんばんは';
}

export default function HomeScreen() {
  const currentUser = useAppStore((state) => state.currentUser);
  const currentMorningRequest = useAppStore((state) => state.currentMorningRequest);
  const assignedWakeVoice = useAppStore((state) => state.assignedWakeVoice);

  if (!currentUser) {
    return <Redirect href="/onboarding" />;
  }

  function handleMorningAction() {
    if (!currentMorningRequest) {
      router.push('/morning/setup');
      return;
    }

    router.push(assignedWakeVoice ? '/morning/ready' : '/morning/give-choice');
  }

  return (
    <Screen contentStyle={styles.content} testID="home-screen">
      <View style={styles.topBar}>
        <AppLogo compact mode="light" />
        <Avatar avatarId={currentUser.avatarId} name={currentUser.nickname} size={40} />
      </View>

      <View style={styles.greeting}>
        <AppText variant="screenTitle">
          {getGreeting()}、{currentUser.nickname}さん
        </AppText>
        <AppText variant="secondary" tone="soft">
          明日の朝を、少しだけ整えておきましょう。
        </AppText>
      </View>

      <NextMorningCard
        onAction={handleMorningAction}
        request={currentMorningRequest}
        wakeVoice={assignedWakeVoice}
      />

      <View style={styles.voiceNote}>
        <Avatar avatarId="sky" name="Yui" size={44} />
        <View style={styles.voiceCopy}>
          <AppText variant="secondary">声の向こうに、人がいる。</AppText>
          <AppText variant="caption" tone="muted">
            あなたの明日に向けて、誰かが短い声を残します。
          </AppText>
          <View style={styles.wave}>
            <Waveform color={colors.indigo} height={22} levels={[5, 12, 19, 8, 16, 6, 13]} />
          </View>
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: spacing.xxl,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  greeting: {
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  voiceNote: {
    marginTop: spacing.lg,
    paddingTop: spacing.xl,
    borderTopWidth: 1,
    borderTopColor: colors.separator,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
  },
  voiceCopy: {
    flex: 1,
    gap: spacing.xs,
  },
  wave: {
    width: 96,
    marginTop: spacing.sm,
  },
});
