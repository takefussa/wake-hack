import Ionicons from "@expo/vector-icons/Ionicons";
import { Redirect, router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useRef, useState } from "react";
import { StyleSheet, View } from "react-native";

import { AppButton } from "@/components/common/app-button";
import { AppText } from "@/components/common/app-text";
import { Screen } from "@/components/common/screen";
import { ScreenHeader } from "@/components/common/screen-header";
import { Waveform } from "@/components/common/waveform";
import { colors, radii, spacing } from "@/constants/theme";
import { goBackOrReplace } from "@/features/navigation/go-back";
import { useTapLock } from "@/hooks/use-tap-lock";
import { useAppStore } from "@/store/use-app-store";

export default function GiveChoiceScreen() {
  const currentUser = useAppStore((state) => state.currentUser);

  const currentMorningRequest = useAppStore(
    (state) => state.currentMorningRequest,
  );

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
    return <Redirect href="/morning/summary" />;
  }

  function handleCommunity() {
    if (isSavingCommunityRef.current) {
      return;
    }

    isSavingCommunityRef.current = true;

    setIsSavingCommunity(true);
    setError(null);

    try {
      /*
       * Supabase側のMorning Requestはopenのままにする。
       *
       * Aがこの画面を閉じたあとでも、
       * BがAのリクエストをタイムラインから選び、
       * Personal Voiceを送れる必要があるため。
       *
       * Communityはあくまでローカルのfallback。
       */
      chooseCommunityWake();

      router.replace("/morning/ready");
    } catch {
      setError("明日の朝を更新できませんでした。もう一度お試しください。");

      isSavingCommunityRef.current = false;

      setIsSavingCommunity(false);
    }
  }

  function handleGive() {
    runOnce(() => router.replace("/(tabs)/connections"));
  }

  return (
    <Screen contentStyle={styles.content} testID="give-choice-screen">
      <StatusBar style="dark" />

      <ScreenHeader
        onBack={() => goBackOrReplace("/morning/condition")}
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
        <AppText variant="screenTitle">声を届けると、あなたにも届く</AppText>

        <AppText variant="secondary" tone="soft">
          今夜、誰かに短い声を届けると、朝は別の誰かがあなたに残した声を受け取れます。
        </AppText>
      </View>

      <View style={styles.flow}>
        <View style={styles.flowStep}>
          <View style={styles.flowIcon}>
            <Ionicons color={colors.indigo} name="time-outline" size={20} />
          </View>

          <View style={styles.flowCopy}>
            <AppText variant="caption" tone="muted">
              1
            </AppText>

            <AppText variant="bodyMedium">起きる時刻を決める</AppText>
          </View>
        </View>

        <View style={styles.flowLine} />

        <View style={styles.flowStep}>
          <View style={styles.flowIcon}>
            <Ionicons color={colors.indigo} name="mic-outline" size={20} />
          </View>

          <View style={styles.flowCopy}>
            <AppText variant="caption" tone="muted">
              2
            </AppText>

            <AppText variant="bodyMedium">誰かへ10秒の声を届ける</AppText>
          </View>
        </View>

        <View style={styles.flowLine} />

        <View style={styles.flowStep}>
          <View style={styles.flowIcon}>
            <Ionicons
              color={colors.warm}
              name="volume-medium-outline"
              size={20}
            />
          </View>

          <View style={styles.flowCopy}>
            <AppText variant="caption" tone="muted">
              3
            </AppText>

            <AppText variant="bodyMedium">朝、あなたへの声が届く</AppText>
          </View>
        </View>
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
          label={isSavingCommunity ? "保存しています…" : "今日は届けない"}
          onPress={handleCommunity}
          variant="text"
        />
      </View>

      {error ? (
        <AppText variant="caption" style={styles.error}>
          {error}
        </AppText>
      ) : null}

      <AppText variant="caption" tone="muted" style={styles.note}>
        声を届けた相手と、あなたを起こす相手は別の人です。届けない日は、みんな向けの声で朝を迎えます。
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
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.lg,
  },

  checkCircle: {
    width: 52,
    height: 52,
    borderRadius: radii.avatar,
    backgroundColor: colors.indigo,
    alignItems: "center",
    justifyContent: "center",
  },

  wave: {
    width: 144,
  },

  question: {
    gap: spacing.md,
  },

  flow: {
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.card,
    backgroundColor: colors.surface,
  },

  flowStep: {
    minHeight: 48,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },

  flowIcon: {
    width: 40,
    height: 40,
    borderRadius: radii.avatar,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surfaceSubtle,
  },

  flowCopy: {
    flex: 1,
    flexDirection: "row",
    alignItems: "baseline",
    gap: spacing.sm,
  },

  flowLine: {
    width: 1,
    height: spacing.md,
    marginLeft: 20,
    backgroundColor: colors.border,
  },

  actions: {
    gap: spacing.sm,
  },

  note: {
    textAlign: "center",
  },

  error: {
    color: colors.danger,
    textAlign: "center",
  },
});
