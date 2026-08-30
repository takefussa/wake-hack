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

        <View style={styles.descriptionPaper}>
          <View style={styles.descriptionRow}>
            <Ionicons
              name="alarm-outline"
              size={19}
              color="#30463E"
            />

            <AppText style={styles.description}>
              明日、声を届けてほしい時刻を選びます。
            </AppText>
          </View>
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

          <View style={styles.minuteNote}>
            <Ionicons
              name="bulb-outline"
              size={16}
              color="#C69D38"
            />

            <AppText style={styles.minuteNoteText}>
              数字を上下にスクロールして設定できます
            </AppText>
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
    backgroundColor: '#F7F0DE',
  },

  paperLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: 'rgba(117, 163, 177, 0.14)',
  },

  marginLine: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 44,
    width: 1,
    backgroundColor: 'rgba(219, 124, 124, 0.32)',
  },

  content: {
    paddingHorizontal: 20,
    paddingTop: 4,
    paddingBottom: 24,
  },

  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    marginLeft: 2,
    marginBottom: 8,
  },

  backText: {
    color: '#30463E',
    fontSize: 16,
    fontWeight: '700',
  },

  stepTape: {
    alignSelf: 'flex-start',
    marginLeft: 34,
    marginBottom: 2,
    paddingHorizontal: 16,
    paddingVertical: 6,
    backgroundColor: '#B7D9E8',
    transform: [{ rotate: '-1.5deg' }],
  },

  stepText: {
    color: '#30463E',
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 1,
  },

  titlePaper: {
    alignSelf: 'center',
    paddingHorizontal: 22,
    paddingTop: 12,
    paddingBottom: 10,
    backgroundColor: '#F8E8B9',
  },

  title: {
    color: '#30463E',
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: 0.5,
  },

  redUnderline: {
    height: 3,
    marginTop: 7,
    borderRadius: 10,
    backgroundColor: '#EE9D95',
  },

  descriptionPaper: {
    alignSelf: 'center',
    marginTop: 5,
    paddingHorizontal: 18,
    paddingVertical: 10,
    backgroundColor: '#FFFDF7',
  },

  descriptionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
  },

  description: {
    color: '#30463E',
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '600',
  },

  timePaper: {
    marginTop: 16,
    paddingHorizontal: 16,
    paddingTop: 24,
    paddingBottom: 14,
    backgroundColor: '#FCF8EA',
    borderWidth: 1,
    borderColor: '#C7BBA4',

    shadowColor: '#786D5D',
    shadowOpacity: 0.07,
    shadowRadius: 4,
    shadowOffset: {
      width: 1,
      height: 2,
    },
    elevation: 1,
  },

  blueTape: {
    position: 'absolute',
    top: -9,
    left: -7,
    width: 76,
    height: 20,
    backgroundColor: '#89BED6',
    opacity: 0.75,
    transform: [{ rotate: '-9deg' }],
  },

  timeLabel: {
    textAlign: 'center',
    marginBottom: 4,
    color: '#30463E',
    fontSize: 17,
    fontWeight: '800',
  },

  timeWheelContainer: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },

  minuteNote: {
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
    paddingHorizontal: 11,
    paddingVertical: 7,

    backgroundColor: '#FFFDF8',

    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#C8BDA8',
  },

  minuteNoteText: {
    color: '#5C625C',
    fontSize: 12,
  },

  quickPaper: {
    marginTop: 14,
    paddingHorizontal: 14,
    paddingTop: 13,
    paddingBottom: 14,

    backgroundColor: '#FCF8EA',

    borderWidth: 1,
    borderColor: '#C7BBA4',
  },

  quickHeading: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,

    marginBottom: 11,
    paddingHorizontal: 9,
    paddingVertical: 5,

    backgroundColor: '#E8E8CB',
  },

  quickTitle: {
    color: '#30463E',
    fontSize: 16,
    fontWeight: '800',
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
    minHeight: 48,

    alignItems: 'center',
    justifyContent: 'center',

    backgroundColor: '#FFFDF7',

    borderWidth: 1,
    borderColor: '#C9BCA7',
    borderRadius: 3,
  },

  quickChoiceSelected: {
    backgroundColor: '#B8D8E8',
    borderColor: '#68A4C2',
    borderWidth: 1.5,
  },

  quickChoiceText: {
    color: '#35483F',
    fontSize: 16,
    fontWeight: '600',
  },

  quickChoiceTextSelected: {
    fontWeight: '800',
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

    backgroundColor: '#A9B99B',
  },

  nextButton: {
    marginTop: 14,
    marginHorizontal: 20,

    minHeight: 60,
    paddingHorizontal: 24,

    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 34,

    backgroundColor: '#8EC3DE',

    borderWidth: 1,
    borderColor: '#68A4C2',

    transform: [{ rotate: '-0.4deg' }],
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
    fontWeight: '800',
  },
});