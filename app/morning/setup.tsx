import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { Redirect, router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppText } from '@/components/common/app-text';
import { NotebookWallpaper } from '@/components/common/notebook-wallpaper';
import { TimeWheel } from '@/components/morning/time-wheel';
import { quickWakeTimes } from '@/constants/options';
import { paperColors, shadows } from '@/constants/theme';
import { demoMorningDefaults } from '@/data/demo-scenario';
import { goBackOrReplace } from '@/features/navigation/go-back';
import { useTapLock } from '@/hooks/use-tap-lock';
import { useAppStore } from '@/store/use-app-store';

const quickWakeTimesStorageKey = 'wake-hack-quick-wake-times-v01';
const wakeTimePattern = /^(?:[01]\d|2[0-3]):[0-5]\d$/;

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
  const [savedQuickTimes, setSavedQuickTimes] = useState<string[]>([
    ...quickWakeTimes,
  ]);
  const [isEditingQuickTimes, setIsEditingQuickTimes] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function loadQuickWakeTimes() {
      try {
        const storedValue = await AsyncStorage.getItem(
          quickWakeTimesStorageKey
        );

        if (!storedValue) return;

        const parsedValue: unknown = JSON.parse(storedValue);
        if (!Array.isArray(parsedValue)) return;

        const validTimes = parsedValue
          .filter(
            (value): value is string =>
              typeof value === 'string' && wakeTimePattern.test(value)
          )
          .slice(0, 4);

        if (isMounted && validTimes.length > 0) {
          setSavedQuickTimes(validTimes);
        }
      } catch {
        // 保存値が壊れている場合は初期値を使う。
      }
    }

    void loadQuickWakeTimes();

    return () => {
      isMounted = false;
    };
  }, []);

  if (!currentUser) {
    return <Redirect href="/onboarding" />;
  }

  function handleNext() {
    runOnce(() => {
      setMorningWakeTime(wakeAt);
      router.push('/morning/condition');
    });
  }

  function saveQuickWakeTimes(nextTimes: string[]) {
    setSavedQuickTimes(nextTimes);
    void AsyncStorage.setItem(
      quickWakeTimesStorageKey,
      JSON.stringify(nextTimes)
    );
  }

  function handleQuickTimePress(time: string) {
    if (!isEditingQuickTimes) {
      setWakeAt(time);
      return;
    }

    if (savedQuickTimes.length <= 1) return;

    saveQuickWakeTimes(
      savedQuickTimes.filter((savedTime) => savedTime !== time)
    );
  }

  function handleAddQuickTime() {
    if (
      savedQuickTimes.length >= 4 ||
      savedQuickTimes.includes(wakeAt)
    ) {
      return;
    }

    saveQuickWakeTimes([...savedQuickTimes, wakeAt]);
  }

  return (
    <SafeAreaView
      style={styles.safeArea}
      testID="morning-setup-screen"
    >
      <StatusBar style="dark" />

      <NotebookWallpaper />

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
          <View style={styles.quickHeadingRow}>
            <View style={styles.quickHeading}>
              <Ionicons
                name="star-outline"
                size={19}
                color={paperColors.ink}
              />

              <AppText style={styles.quickTitle}>
                よく使う時刻
              </AppText>
            </View>

            <Pressable
              onPress={() =>
                setIsEditingQuickTimes((isEditing) => !isEditing)
              }
              hitSlop={8}
              style={styles.editQuickButton}
            >
              <Ionicons
                name={isEditingQuickTimes ? 'checkmark' : 'pencil-outline'}
                size={15}
                color={paperColors.ink}
              />
              <AppText style={styles.editQuickText}>
                {isEditingQuickTimes ? '完了' : '編集'}
              </AppText>
            </Pressable>
          </View>

          {isEditingQuickTimes ? (
            <AppText style={styles.quickEditHint}>
              削除したい時刻を押し、ホイールで選んだ時刻を追加できます。
            </AppText>
          ) : null}

          <View style={styles.quickChoices}>
            {savedQuickTimes.map((time) => {
              const selected = !isEditingQuickTimes && wakeAt === time;

              return (
                <Pressable
                  key={time}
                  onPress={() => handleQuickTimePress(time)}
                  style={[
                    styles.quickChoice,
                    selected &&
                      styles.quickChoiceSelected,
                    isEditingQuickTimes && styles.quickChoiceEditing,
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

                  {isEditingQuickTimes ? (
                    <View style={styles.removeBubble}>
                      <Ionicons
                        name="remove"
                        size={14}
                        color={paperColors.ink}
                      />
                    </View>
                  ) : selected ? (
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

            {isEditingQuickTimes &&
            savedQuickTimes.length < 4 &&
            !savedQuickTimes.includes(wakeAt) ? (
              <Pressable
                onPress={handleAddQuickTime}
                style={styles.addQuickTime}
              >
                <Ionicons
                  name="add"
                  size={17}
                  color={paperColors.ink}
                />
                <AppText style={styles.addQuickTimeText}>
                  {wakeAt}を追加
                </AppText>
              </Pressable>
            ) : null}
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
    backgroundColor: paperColors.tape,
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
    backgroundColor: 'transparent',
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
    backgroundColor: paperColors.ruleBlue,
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
    backgroundColor: paperColors.tape,
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

  quickHeadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 11,
  },

  quickHeading: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,

    paddingHorizontal: 9,
    paddingVertical: 5,

    backgroundColor: paperColors.noteBlue,
  },

  quickTitle: {
    color: '#30463E',
    fontSize: 16,
  },

  editQuickButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderBottomWidth: 3,
    borderBottomColor: paperColors.ruleBlue,
  },

  editQuickText: {
    color: paperColors.ink,
    fontSize: 14,
  },

  quickEditHint: {
    marginTop: -3,
    marginBottom: 9,
    color: '#59635F',
    fontSize: 12,
    lineHeight: 18,
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

  quickChoiceEditing: {
    borderStyle: 'solid',
    borderColor: paperColors.ruleBlue,
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

  removeBubble: {
    position: 'absolute',
    top: -7,
    right: -5,
    width: 21,
    height: 21,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: paperColors.salmon,
  },

  addQuickTime: {
    minHeight: 44,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    backgroundColor: paperColors.noteBlue,
    borderWidth: 1,
    borderColor: paperColors.ruleBlue,
    borderStyle: 'solid',
    borderRadius: 3,
  },

  addQuickTimeText: {
    color: paperColors.ink,
    fontSize: 14,
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
