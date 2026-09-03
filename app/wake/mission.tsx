import Ionicons from '@expo/vector-icons/Ionicons';
import { Accelerometer } from 'expo-sensors';
import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useMemo, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';

import { AppButton } from '@/components/common/app-button';
import { AppText } from '@/components/common/app-text';
import { IconButton } from '@/components/common/icon-button';
import { MorningScreen } from '@/components/wake/morning-screen';
import {
  colors,
  fonts,
  paperColors,
  radii,
  shadows,
  spacing,
} from '@/constants/theme';
import { isDemoMode } from '@/features/demo/demo-mode';
import {
  resolveWakeProofMission,
  wakeProofMissions,
  wakeProofPhrase,
  wakeProofShakeGoal,
  wakeProofTapSequence,
} from '@/features/wake/wake-proof-missions';
import { isWakeContextValid } from '@/features/wake/is-wake-context-valid';
import { useTapLock } from '@/hooks/use-tap-lock';
import { wakeService } from '@/services/wake-service';
import { useAppStore } from '@/store/use-app-store';

type MissionStatus = 'active' | 'complete';

export default function WakeMissionScreen() {
  const params = useLocalSearchParams<{ review?: string | string[] }>();
  const reviewParam = Array.isArray(params.review) ? params.review[0] : params.review;
  const isReview = reviewParam === '1';
  const currentUser = useAppStore((state) => state.currentUser);
  const currentMorningRequest = useAppStore((state) => state.currentMorningRequest);
  const assignedWakeVoice = useAppStore((state) => state.assignedWakeVoice);
  const wakeSession = useAppStore((state) => state.wakeSession);
  const completeWakeSession = useAppStore((state) => state.completeWakeSession);
  const runOnce = useTapLock();
  const [phraseInput, setPhraseInput] = useState('');
  const [tapIndex, setTapIndex] = useState(0);
  const [shakeCount, setShakeCount] = useState(0);
  const [lastMagnitude, setLastMagnitude] = useState(0);
  const [isShakeAvailable, setIsShakeAvailable] = useState(true);
  const [status, setStatus] = useState<MissionStatus>('active');
  const [missionOffset, setMissionOffset] = useState(0);

  // A desktop browser has no accelerometer, so the shake mission would be a
  // dead end for a judge opening the web demo.
  const availableMissions = useMemo(
    () =>
      isDemoMode
        ? wakeProofMissions.filter((candidate) => candidate.type !== 'shake')
        : wakeProofMissions,
    []
  );
  const defaultMission = useMemo(
    () => resolveWakeProofMission(wakeSession?.id ?? 'wake-session', availableMissions),
    [availableMissions, wakeSession?.id]
  );
  const mission = useMemo(() => {
    const defaultIndex = availableMissions.findIndex(
      (candidate) => candidate.type === defaultMission.type
    );
    return availableMissions[
      (Math.max(defaultIndex, 0) + missionOffset) % availableMissions.length
    ];
  }, [availableMissions, defaultMission.type, missionOffset]);

  const hasValidMissionContext = Boolean(
    currentUser &&
      currentMorningRequest &&
      assignedWakeVoice &&
      wakeSession &&
      isWakeContextValid({
        currentUser,
        morningRequest: currentMorningRequest,
        voice: assignedWakeVoice,
        wakeSession,
      })
  );

  const isPhraseComplete =
    phraseInput.trim().toUpperCase() === wakeProofPhrase.toUpperCase();
  const isTapComplete = tapIndex >= wakeProofTapSequence.length;
  const isShakeComplete = shakeCount >= wakeProofShakeGoal;
  const canComplete =
    mission.type === 'phrase'
      ? isPhraseComplete
      : mission.type === 'tap'
        ? isTapComplete
        : isShakeComplete;

  useEffect(() => {
    if (mission.type !== 'shake' || status !== 'active') return;

    let isMounted = true;
    let lastShakeAt = 0;
    let subscription: { remove: () => void } | null = null;

    async function subscribe() {
      const isAvailable = await Accelerometer.isAvailableAsync();
      if (!isMounted) return;
      setIsShakeAvailable(isAvailable);
      if (!isAvailable) return;

      Accelerometer.setUpdateInterval(180);
      subscription = Accelerometer.addListener(({ x, y, z }) => {
        const magnitude = Math.sqrt(x * x + y * y + z * z);
        setLastMagnitude(magnitude);
        const now = Date.now();
        if (magnitude > 1.85 && now - lastShakeAt > 420) {
          lastShakeAt = now;
          setShakeCount((current) => Math.min(current + 1, wakeProofShakeGoal));
        }
      });
    }

    void subscribe();

    return () => {
      isMounted = false;
      subscription?.remove();
    };
  }, [mission.type, status]);

  useEffect(() => {
    if (canComplete) setStatus('complete');
  }, [canComplete]);

  if (
    !hasValidMissionContext ||
    !currentUser ||
    !currentMorningRequest ||
    !assignedWakeVoice ||
    !wakeSession
  ) {
    return <Redirect href="/morning/ready" />;
  }
  if (wakeSession.status === 'completed' && !isReview) {
    return <Redirect href="/wake/complete" />;
  }
  if (wakeSession.status !== 'ringing' && !(isReview && wakeSession.status === 'completed')) {
    return <Redirect href="/wake/alarm" />;
  }

  function handleBack() {
    runOnce(() => {
      if (isReview) {
        router.replace({ pathname: '/wake/alarm', params: { review: '1' } });
        return;
      }
      router.replace('/wake/alarm');
    });
  }

  function handleComplete() {
    if (isReview) {
      runOnce(() => router.replace('/wake/complete'));
      return;
    }
    if (!canComplete) return;
    runOnce(() => {
      const completedSession = completeWakeSession();
      if (completedSession) {
        void wakeService.completeWakeSession(completedSession);
      }
      router.replace('/wake/complete');
    });
  }

  function handleTap(targetIndex: number) {
    if (wakeProofTapSequence[tapIndex] === targetIndex) {
      setTapIndex((current) => current + 1);
      return;
    }
    setTapIndex(0);
  }

  function handleChangeMission() {
    setPhraseInput('');
    setTapIndex(0);
    setShakeCount(0);
    setLastMagnitude(0);
    setStatus('active');
    setMissionOffset((current) => current + 1);
  }

  return (
    <MorningScreen contentStyle={styles.content} testID="wake-mission-screen">
      <StatusBar style="dark" />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardAvoider}>
        <View style={styles.navigation}>
          <IconButton icon="chevron-back" label="朝の準備に戻る" onPress={handleBack} />
          <AppButton
            buttonColor={paperColors.orange}
            compact
            contentColor={paperColors.ink}
            icon="refresh-outline"
            label="別の証明にする"
            onPress={handleChangeMission}
            style={styles.changeMissionButton}
          />
        </View>

        <View style={styles.header}>
          <View pointerEvents="none" style={styles.greenTape} />
          <View style={styles.iconMark}>
            <Ionicons color={colors.textInverse} name="checkmark-done" size={28} />
          </View>
          <AppText variant="caption" tone="warm" style={styles.centeredText}>
            WAKE PROOF
          </AppText>
          <AppText variant="screenTitle" style={styles.centeredText}>
            起きた証明
          </AppText>
          <AppText variant="secondary" tone="soft" style={styles.centeredText}>
            {mission.description}
          </AppText>
        </View>

        <View style={styles.missionPanel}>
          <View pointerEvents="none" style={[styles.greenTape, styles.missionTape]} />
          <AppText variant="sectionTitle" style={styles.centeredText}>
            {mission.title}
          </AppText>

          {mission.type === 'phrase' ? (
            <View style={styles.phraseArea}>
              <View style={styles.phraseBadge}>
                <AppText variant="displayNumber" style={styles.phraseText}>
                  {wakeProofPhrase}
                </AppText>
              </View>
              <TextInput
                autoCapitalize="characters"
                autoCorrect={false}
                onChangeText={setPhraseInput}
                placeholder="合言葉を入力"
                placeholderTextColor={colors.textTertiary}
                style={styles.input}
                testID="wake-proof-phrase-input"
                value={phraseInput}
              />
            </View>
          ) : null}

          {mission.type === 'tap' ? (
            <View style={styles.tapArea}>
              <View style={styles.progressRow}>
                {wakeProofTapSequence.map((target, index) => (
                  <View
                    key={`${target}-${index}`}
                    style={[
                      styles.progressDot,
                      index < tapIndex && styles.progressDotDone,
                      index === tapIndex && styles.progressDotCurrent,
                    ]}
                  />
                ))}
              </View>
              <View style={styles.tapGrid}>
                {[0, 1, 2, 3].map((target) => {
                  const isTarget = wakeProofTapSequence[tapIndex] === target;
                  return (
                    <Pressable
                      accessibilityRole="button"
                      key={target}
                      onPress={() => handleTap(target)}
                      style={({ pressed }) => [
                        styles.tapButton,
                        isTarget && styles.tapButtonTarget,
                        pressed && styles.tapButtonPressed,
                      ]}
                      testID={`wake-proof-tap-${target}`}>
                      <AppText variant="sectionTitle">{target + 1}</AppText>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          ) : null}

          {mission.type === 'shake' ? (
            <View style={styles.shakeArea}>
              <View style={styles.shakeMeter}>
                <Ionicons color={colors.warm} name="phone-portrait-outline" size={42} />
                <AppText variant="displayNumber" style={styles.shakeCount}>
                  {shakeCount} / {wakeProofShakeGoal}
                </AppText>
              </View>
              <View style={styles.shakeBar}>
                <View
                  style={[
                    styles.shakeBarFill,
                    { width: `${(shakeCount / wakeProofShakeGoal) * 100}%` },
                  ]}
                />
              </View>
              <AppText variant="caption" tone="muted" style={styles.centeredText}>
                {isShakeAvailable
                  ? `ゆらぎ ${lastMagnitude.toFixed(1)}`
                  : 'この端末ではセンサーを使えません'}
              </AppText>
            </View>
          ) : null}
        </View>

        <View style={styles.footer}>
          <AppButton
            buttonColor={paperColors.orange}
            contentColor={paperColors.ink}
            disabled={!isReview && !canComplete}
            icon={isReview || canComplete ? 'sunny-outline' : 'lock-closed-outline'}
            label={isReview ? '完了画面に戻る' : canComplete ? '朝をはじめる' : 'ミッション中'}
            onPress={handleComplete}
            style={styles.primaryAction}
            testID="wake-proof-complete"
            variant="warm"
          />
        </View>
      </KeyboardAvoidingView>
    </MorningScreen>
  );
}

const styles = StyleSheet.create({
  content: {
    justifyContent: 'space-between',
    gap: spacing.xl,
  },
  keyboardAvoider: {
    flex: 1,
    justifyContent: 'space-between',
    gap: spacing.xl,
  },
  navigation: {
    minHeight: 44,
    marginLeft: -spacing.md,
    marginRight: -spacing.xs,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  changeMissionButton: {
    borderWidth: 2,
    borderColor: paperColors.ink,
    paddingHorizontal: spacing.md,
  },
  header: {
    position: 'relative',
    minHeight: 210,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xxl,
    borderWidth: 2,
    borderColor: paperColors.ink,
    borderRadius: 18,
    backgroundColor: paperColors.base,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    ...shadows.paper,
  },
  iconMark: {
    width: 58,
    height: 58,
    borderRadius: radii.avatar,
    borderWidth: 2,
    borderColor: paperColors.ink,
    backgroundColor: colors.success,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  centeredText: {
    textAlign: 'center',
  },
  missionPanel: {
    position: 'relative',
    minHeight: 300,
    borderWidth: 2,
    borderColor: paperColors.ink,
    borderRadius: 18,
    backgroundColor: paperColors.cardGray,
    padding: spacing.xl,
    justifyContent: 'center',
    gap: spacing.xl,
    ...shadows.paper,
  },
  greenTape: {
    position: 'absolute',
    top: -13,
    left: '34%',
    right: '34%',
    zIndex: 2,
    height: 24,
    backgroundColor: colors.success,
    opacity: 0.82,
    transform: [{ rotate: '-1.5deg' }],
  },
  missionTape: {
    transform: [{ rotate: '1deg' }],
  },
  phraseArea: {
    gap: spacing.lg,
  },
  phraseBadge: {
    minHeight: 104,
    borderRadius: radii.card,
    borderWidth: 2,
    borderColor: paperColors.ink,
    backgroundColor: colors.warmSoft,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  phraseText: {
    color: colors.navy,
    fontFamily: fonts?.rounded,
    textAlign: 'center',
  },
  input: {
    minHeight: 52,
    borderWidth: 2,
    borderColor: paperColors.ink,
    borderRadius: radii.input,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.lg,
    color: colors.text,
    fontFamily: fonts?.sans,
    fontSize: 18,
    textAlign: 'center',
  },
  tapArea: {
    gap: spacing.xl,
  },
  progressRow: {
    height: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  progressDot: {
    width: 12,
    height: 12,
    borderRadius: radii.avatar,
    backgroundColor: colors.border,
  },
  progressDotCurrent: {
    backgroundColor: colors.warm,
  },
  progressDotDone: {
    backgroundColor: colors.success,
  },
  tapGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: spacing.md,
  },
  tapButton: {
    width: 96,
    height: 96,
    borderRadius: radii.avatar,
    borderWidth: 2,
    borderColor: paperColors.ink,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tapButtonTarget: {
    borderColor: colors.warm,
    backgroundColor: colors.warmSoft,
  },
  tapButtonPressed: {
    opacity: 0.72,
    transform: [{ scale: 0.96 }],
  },
  shakeArea: {
    alignItems: 'center',
    gap: spacing.lg,
  },
  shakeMeter: {
    minHeight: 120,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  shakeCount: {
    color: colors.navy,
    fontFamily: fonts?.rounded,
  },
  shakeBar: {
    width: '100%',
    height: 12,
    overflow: 'hidden',
    borderRadius: radii.badge,
    backgroundColor: colors.surfaceSubtle,
  },
  shakeBarFill: {
    height: '100%',
    borderRadius: radii.badge,
    backgroundColor: colors.warm,
  },
  footer: {
    padding: spacing.lg,
    borderWidth: 2,
    borderColor: paperColors.ink,
    borderRadius: 18,
    backgroundColor: paperColors.base,
    gap: spacing.sm,
    ...shadows.paper,
  },
  primaryAction: {
    borderWidth: 2,
    borderColor: paperColors.ink,
  },
});
