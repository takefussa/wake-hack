import { Ionicons } from '@expo/vector-icons';
import { Redirect, router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppText } from '@/components/common/app-text';
import { TimeWheel } from '@/components/morning/time-wheel';
import { quickWakeTimes } from '@/constants/options';
import { paperColors, shadows } from '@/constants/theme';
import { demoMorningDefaults } from '@/data/demo-scenario';
import { goBackOrReplace } from '@/features/navigation/go-back';
import { useTapLock } from '@/hooks/use-tap-lock';
import { useAppStore } from '@/store/use-app-store';

export default function MorningSetupScreen() {
  const currentUser = useAppStore((state) => state.currentUser);
  const morningRequestDraft = useAppStore((state) => state.morningRequestDraft);
  const currentMorningRequest = useAppStore(
    (state) => state.currentMorningRequest
  );
  const setMorningWakeTime = useAppStore(
    (state) => state.setMorningWakeTime
  );

  const runOnce = useTapLock();

  const [wakeAt, setWakeAt] = useState(
    morningRequestDraft?.wakeAt ??
      currentMorningRequest?.wakeAt ??
      demoMorningDefaults.wakeAt
  );

  if (!currentUser) {
    return <Redirect href="/onboarding" />;
  }

  function handleNext() {
    runOnce(() => {
      setMorningWakeTime(wakeAt);
      router.push('/morning/condition');
    });
  }

  return (
    <SafeAreaView
      style={styles.safeArea}
      testID="morning-setup-screen"
    >
      <StatusBar style="dark" />

      <View
        pointerEvents="none"
        style={StyleSheet.absoluteFill}
      >
        {Array.from({ length: 30 }).map((_, index) => (
          <View
            key={index}
            style={[
              styles.paperLine,
              { top: 30 + index * 32 },
            ]}
          />
        ))}

        <View style={styles.marginLine} />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Pressable
          onPress={() => goBackOrReplace('/(tabs)')}
          style={styles.backButton}
        >
          <Ionicons
            name="chevron-back"
            size={23}
            color="#30463E"
          />

          <AppText style={styles.backText}>
            戻る
          </AppText>
        </Pressable>

        <View style={styles.stepTape}>
          <AppText style={styles.stepText}>
            明日の朝　1 / 2
          </AppText>
        </View>

        <View style={styles.titlePaper}>
          <AppText style={styles.title}>
            何時に起きますか？
          </AppText>

          <View style={styles.redUnderline} />
        </View>

        <View style={styles.timePaper}>
          <View style={styles.blueTape} />

          <AppText style={styles.timeLabel}>
            起きる時間
          </AppText>

          <View style={styles.timeWheelContainer}>
            <TimeWheel
              value={wakeAt}
              onChange={setWakeAt}
            />
          </View>

        </View>

        <View style={styles.quickPaper}>
          <View style={styles.quickHeading}>
            <Ionicons
              name="star-outline"
              size={19}
              color="#C69D38"
            />

            <AppText style={styles.quickTitle}>
              よく使う時刻
            </AppText>
          </View>

          <View style={styles.quickChoices}>
            {quickWakeTimes.map((time) => {
              const selected = wakeAt === time;

              return (
                <Pressable
                  key={time}
                  onPress={() => setWakeAt(time)}
                  style={[
                    styles.quickChoice,
                    selected &&
                      styles.quickChoiceSelected,
                  ]}
                >
                  <AppText
                    style={[
                      styles.quickChoiceText,
                      selected &&
                        styles.quickChoiceTextSelected,
                    ]}
                  >
                    {time}
                  </AppText>

                  {selected ? (
                    <View style={styles.checkBubble}>
                      <Ionicons
                        name="checkmark"
                        size={13}
                        color="#30463E"
                      />
                    </View>
                  ) : null}
                </Pressable>
              );
            })}
          </View>
        </View>

        <Pressable
          onPress={handleNext}
          style={({ pressed }) => [
            styles.nextButton,
            pressed && styles.nextButtonPressed,
          ]}
          testID="morning-setup-next"
        >
          <AppText style={styles.nextButtonText}>
            次へ
          </AppText>

          <Ionicons
            name="arrow-forward"
            size={25}
            color="#30463E"
          />
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F6F6F6',
  },

  paperLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: 'rgba(174, 203, 226, 0.52)',
  },

  marginLine: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 44,
    width: 1,
    backgroundColor: 'rgba(243, 196, 197, 0.80)',
  },

  content: {
    paddingHorizontal: 20,
    paddingTop: 4,
    paddingBottom: 16,
  },

  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    marginTop: 14,
    marginLeft: 2,
    marginBottom: 8,
  },

  backText: {
    color: '#30463E',
    fontSize: 16,
  },

  stepTape: {
    alignSelf: 'flex-start',
    marginTop: 4,
    marginLeft: 34,
    marginBottom: 2,
    paddingHorizontal: 16,
    paddingVertical: 6,
    backgroundColor: '#DCEEFB',
    transform: [{ rotate: '-1.5deg' }],
  },

  stepText: {
    color: '#30463E',
    fontSize: 15,
    letterSpacing: 1,
  },

  titlePaper: {
    alignSelf: 'center',
    paddingHorizontal: 22,
    paddingTop: 12,
    paddingBottom: 10,
    backgroundColor: paperColors.paleYellow,
  },

  title: {
    color: '#30463E',
    fontSize: 26,
    letterSpacing: 0.5,
  },

  redUnderline: {
    height: 3,
    marginTop: 7,
    borderRadius: 10,
    backgroundColor: '#F3C4C5',
  },

  timePaper: {
    marginTop: 20,
    paddingHorizontal: 12,
    paddingTop: 20,
    paddingBottom: 18,
    backgroundColor: paperColors.base,
    borderWidth: 2,
    borderColor: paperColors.ink,
    borderRadius: 12,
    ...shadows.paper,
  },

  blueTape: {
    position: 'absolute',
    top: -9,
    left: -7,
    width: 76,
    height: 20,
    backgroundColor: '#AECBE2',
    opacity: 0.75,
    transform: [{ rotate: '-9deg' }],
  },

  timeLabel: {
    textAlign: 'center',
    marginBottom: 8,
    color: '#30463E',
    fontSize: 18,
  },

  timeWheelContainer: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },

  quickPaper: {
    marginTop: 12,
    paddingHorizontal: 14,
    paddingTop: 13,
    paddingBottom: 14,

    backgroundColor: paperColors.base,

    borderWidth: 2,
    borderColor: paperColors.ink,
    borderRadius: 12,
    ...shadows.paper,
  },

  quickHeading: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,

    marginBottom: 11,
    paddingHorizontal: 9,
    paddingVertical: 5,

    backgroundColor: paperColors.noteBlue,
  },

  quickTitle: {
    color: '#30463E',
    fontSize: 16,
  },

  quickChoices: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },

  quickChoice: {
    width: '30%',
    flexGrow: 1,
    minWidth: 88,
    minHeight: 44,

    alignItems: 'center',
    justifyContent: 'center',

    backgroundColor: '#FFFDF8',

    borderWidth: 1,
    borderColor: '#C9BCA7',
    borderRadius: 3,
  },

  quickChoiceSelected: {
    backgroundColor: '#DCEEFB',
    borderColor: '#68A4C2',
    borderWidth: 1.5,
  },

  quickChoiceText: {
    color: '#35483F',
    fontSize: 16,
  },

  quickChoiceTextSelected: {
  },

  checkBubble: {
    position: 'absolute',
    top: -7,
    right: -5,

    width: 21,
    height: 21,
    borderRadius: 11,

    alignItems: 'center',
    justifyContent: 'center',

    backgroundColor: '#CAD6C6',
  },

  nextButton: {
    marginTop: 12,
    marginHorizontal: 20,

    minHeight: 56,
    paddingHorizontal: 24,

    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 34,

    backgroundColor: '#F3C4C5',

    borderWidth: 2,
    borderColor: paperColors.ink,

    transform: [{ rotate: '-0.4deg' }],
    ...shadows.paper,
  },

  nextButtonPressed: {
    opacity: 0.72,
    transform: [
      { rotate: '-0.4deg' },
      { scale: 0.985 },
    ],
  },

  nextButtonText: {
    color: '#30463E',
    fontSize: 20,
  },
});
