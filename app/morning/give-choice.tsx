import Ionicons from '@expo/vector-icons/Ionicons';
import { Redirect, router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppButton } from '@/components/common/app-button';
import { AppText } from '@/components/common/app-text';
import { Screen } from '@/components/common/screen';
import { ScreenHeader } from '@/components/common/screen-header';
import { Waveform } from '@/components/common/waveform';
import { colors, radii, spacing } from '@/constants/theme';
import { goBackOrReplace } from '@/features/navigation/go-back';
import { useTapLock } from '@/hooks/use-tap-lock';
import { morningRequestService } from '@/services/morning-request-service';
import { useAppStore } from '@/store/use-app-store';

export default function GiveChoiceScreen() {
  const currentUser = useAppStore((state) => state.currentUser);
  const currentMorningRequest = useAppStore((state) => state.currentMorningRequest);
  const chooseCommunityWake = useAppStore((state) => state.chooseCommunityWake);
  const [isSavingCommunity, setIsSavingCommunity] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isSavingCommunityRef = useRef(false);
  const runOnce = useTapLock();

  if (!currentUser) {
    return <Redirect href="/onboarding" />;
  }
  if (!currentMorningRequest) {
    return <Redirect href="/morning/setup" />;
  }
  if (currentMorningRequest.personalEligible) {
    return <Redirect href="/morning/ready" />;
  }
  const currentMorningRequestId = currentMorningRequest.id;

  async function handleCommunity() {
    if (isSavingCommunityRef.current) return;

    isSavingCommunityRef.current = true;
    setIsSavingCommunity(true);
    setError(null);
    try {
      await morningRequestService.markCommunityReady(currentMorningRequestId);
      chooseCommunityWake();
      router.replace('/morning/ready');
    } catch {
      setError('明日の朝を更新できませんでした。もう一度お試しください。');
      isSavingCommunityRef.current = false;
      setIsSavingCommunity(false);
    }
  }

  function handleGive() {
    runOnce(() => router.replace('/(tabs)/timeline'));
  }

  return (
    <Screen contentStyle={styles.content} testID="give-choice-screen">
      <StatusBar style="dark" />
      <ScreenHeader
        onBack={() => goBackOrReplace('/morning/condition')}
        title="明日の朝の準備ができました"
      />

      <View style={styles.readyMark}>
        <View style={styles.checkCircle}>
          <Ionicons name="checkmark" color={colors.textInverse} size={28} />
        </View>
        <View style={styles.wave}>
          <Waveform
            color={colors.indigo}
            height={32}
            levels={[7, 16, 26, 12, 30, 18, 9, 24, 14]}
          />
        </View>
      </View>

      <View style={styles.question}>
        <AppText variant="screenTitle">誰かの朝も、10秒だけ応援しますか？</AppText>
        <AppText variant="secondary" tone="soft">
          明日の予定を知ったうえで、その人に短い声を届けます。
        </AppText>
      </View>

      <View style={styles.actions}>
        <AppButton
          icon="mic-outline"
          label="誰かに声を届ける"
          onPress={handleGive}
          testID="choose-give"
        />
        <AppButton
          disabled={isSavingCommunity}
          label={isSavingCommunity ? '保存しています…' : '今日は届けない'}
          onPress={() => void handleCommunity()}
          variant="text"
        />
      </View>

      {error ? (
        <AppText variant="caption" style={styles.error}>
          {error}
        </AppText>
      ) : null}

      <AppText variant="caption" tone="muted" style={styles.note}>
        届けない日は、みんなに向けた声で朝を迎えます。
      </AppText>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: spacing.xxl,
  },
  readyMark: {
    minHeight: 120,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.lg,
  },
  checkCircle: {
    width: 52,
    height: 52,
    borderRadius: radii.avatar,
    backgroundColor: colors.indigo,
    alignItems: 'center',
    justifyContent: 'center',
  },
  wave: {
    width: 144,
  },
  question: {
    gap: spacing.md,
  },
  actions: {
    gap: spacing.sm,
  },
  note: {
    textAlign: 'center',
  },
  error: {
    color: colors.danger,
    textAlign: 'center',
  },
});
