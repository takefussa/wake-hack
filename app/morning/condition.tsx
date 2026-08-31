import { Ionicons } from '@expo/vector-icons';
import { Redirect, router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useRef, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppText } from '@/components/common/app-text';
import {
  moodOptions,
  scheduleOptions,
  voiceStyleOptions,
} from '@/constants/options';
import { demoMorningDefaults } from '@/data/demo-scenario';
import { toggleSchedule } from '@/features/morning/morning-request-form';
import { goBackOrReplace } from '@/features/navigation/go-back';
import { morningRequestService } from '@/services/morning-request-service';
import { useAppStore } from '@/store/use-app-store';
import type { MoodType, ScheduleType, VoiceStyle } from '@/types';

type PaperChoiceProps = {
  label: string;
  selected: boolean;
  onPress: () => void;
  tone?: 'green' | 'pink' | 'blue';
};

function PaperChoice({
  label,
  selected,
  onPress,
  tone = 'green',
}: PaperChoiceProps) {
  const selectedStyle =
    tone === 'pink'
      ? styles.choicePink
      : tone === 'blue'
        ? styles.choiceBlue
        : styles.choiceGreen;

  return (
    <Pressable
      onPress={onPress}
      style={[styles.choice, selected && selectedStyle]}
    >
      <AppText style={[styles.choiceText, selected && styles.choiceTextSelected]}>
        {label}
      </AppText>

      {selected ? (
        <View style={styles.choiceCheck}>
          <Ionicons name="checkmark" size={14} color="#30463E" />
        </View>
      ) : null}
    </Pressable>
  );
}

export default function TomorrowConditionScreen() {
  const currentUser = useAppStore((state) => state.currentUser);
  const morningRequestDraft = useAppStore((state) => state.morningRequestDraft);
  const setMorningRequest = useAppStore((state) => state.setMorningRequest);

  const [schedules, setSchedules] = useState<ScheduleType[]>([
    ...demoMorningDefaults.schedules,
  ]);

  const [mood, setMood] = useState<MoodType | null>(
    demoMorningDefaults.mood
  );

  const [voiceStyle, setVoiceStyle] = useState<VoiceStyle | null>(
    demoMorningDefaults.preferredVoiceStyle
  );

  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isSavingRef = useRef(false);

  if (!currentUser) {
    return <Redirect href="/onboarding" />;
  }

  if (!morningRequestDraft) {
    return <Redirect href="/morning/setup" />;
  }

  const currentUserId = currentUser.id;
  const wakeAt = morningRequestDraft.wakeAt;

  const canSubmit =
    schedules.length > 0 &&
    mood !== null &&
    voiceStyle !== null;

  async function handleSubmit() {
    if (!canSubmit || !mood || !voiceStyle || isSavingRef.current) return;

    isSavingRef.current = true;
    setIsSaving(true);
    setError(null);

    try {
      const request = await morningRequestService.createRequest(currentUserId, {
        wakeAt,
        schedules,
        mood,
        preferredVoiceStyle: voiceStyle,
      });

      setMorningRequest(request);
      router.push('/morning/give-choice');
    } catch {
      setError(
        '明日の朝を保存できませんでした。もう一度お試しください。'
      );
      isSavingRef.current = false;
      setIsSaving(false);
    }
  }

  return (
    <SafeAreaView style={styles.safeArea} testID="tomorrow-condition-screen">
      <StatusBar style="dark" />

      <View pointerEvents="none" style={StyleSheet.absoluteFill}>
        {Array.from({ length: 35 }).map((_, index) => (
          <View
            key={index}
            style={[styles.paperLine, { top: 34 + index * 32 }]}
          />
        ))}
        <View style={styles.marginLine} />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Pressable
          onPress={() => goBackOrReplace('/morning/setup')}
          style={styles.backButton}
        >
          <Ionicons name="chevron-back" size={25} color="#30463E" />
          <AppText style={styles.backText}>戻る</AppText>
        </Pressable>

        <View style={[styles.stepTape, styles.pinkStep]}>
          <AppText style={styles.stepText}>明日の朝　2 / 2</AppText>
        </View>

        <View style={styles.titlePaper}>
          <AppText style={styles.title}>どんな朝になりそう？</AppText>
          <View style={styles.redUnderline} />
        </View>

        <View style={styles.descriptionPaper}>
          <View style={styles.descriptionRow}>
            <Ionicons name="alarm-outline" size={21} color="#30463E" />
            <AppText style={styles.description}>
              {wakeAt} の朝について、{'\n'}
              今の気持ちを少しだけ教えてください。
            </AppText>
          </View>
          <View style={styles.blueUnderline} />
        </View>

        <View style={styles.sectionPaper}>
          <View style={styles.pinkTape} />

          <View style={styles.sectionHeading}>
            <View style={[styles.sectionLabel, styles.greenLabel]}>
              <Ionicons name="leaf-outline" size={20} color="#688464" />
              <AppText style={styles.sectionTitle}>明日の予定</AppText>
            </View>

            <AppText style={styles.caption}>複数選べます</AppText>
          </View>

          <View style={styles.choices}>
            {scheduleOptions.map((schedule) => (
              <PaperChoice
                key={schedule}
                label={schedule}
                onPress={() =>
                  setSchedules((current) =>
                    toggleSchedule(current, schedule)
                  )
                }
                selected={schedules.includes(schedule)}
                tone="green"
              />
            ))}
          </View>
        </View>

        <View style={styles.sectionPaper}>
          <View style={[styles.sectionLabel, styles.pinkLabel]}>
            <Ionicons name="heart-outline" size={20} color="#CF827B" />
            <AppText style={styles.sectionTitle}>今の気分</AppText>
          </View>

          <View style={styles.choices}>
            {moodOptions.map((option) => (
              <PaperChoice
                key={option}
                label={option}
                onPress={() => setMood(option)}
                selected={mood === option}
                tone="pink"
              />
            ))}
          </View>
        </View>

        <View style={styles.sectionPaper}>
          <View style={[styles.sectionLabel, styles.blueLabel]}>
            <Ionicons name="mic-outline" size={20} color="#50798A" />
            <AppText style={styles.sectionTitle}>
              どんな声がいいですか？
            </AppText>
          </View>

          <View style={styles.choices}>
            {voiceStyleOptions.map((option) => (
              <PaperChoice
                key={option}
                label={option}
                onPress={() => setVoiceStyle(option)}
                selected={voiceStyle === option}
                tone="blue"
              />
            ))}
          </View>
        </View>

        {error ? (
          <View style={styles.errorPaper}>
            <Ionicons
              name="warning-outline"
              size={20}
              color="#D67B6D"
            />
            <AppText style={styles.errorText}>{error}</AppText>
          </View>
        ) : null}

        <Pressable
          disabled={!canSubmit || isSaving}
          onPress={() => void handleSubmit()}
          style={({ pressed }) => [
            styles.submitButton,
            (!canSubmit || isSaving) && styles.submitDisabled,
            pressed && styles.pressed,
          ]}
          testID="condition-submit"
        >
          <AppText style={styles.submitText}>
            {isSaving ? '保存しています…' : '明日の朝を決める'}
          </AppText>

          {!isSaving ? (
            <Ionicons name="arrow-forward" size={28} color="#30463E" />
          ) : null}
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
    backgroundColor: 'rgba(117, 163, 177, 0.15)',
  },

  marginLine: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 43,
    width: 1,
    backgroundColor: 'rgba(220, 126, 126, 0.35)',
  },

  content: {
    paddingHorizontal: 28,
    paddingTop: 12,
    paddingBottom: 44,
  },

  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    marginBottom: 20,
    marginLeft: -8,
  },

  backText: {
    color: '#30463E',
    fontSize: 17,
  },

  stepTape: {
    alignSelf: 'flex-start',
    paddingHorizontal: 18,
    paddingVertical: 8,
    transform: [{ rotate: '-2deg' }],
    marginLeft: 25,
    marginBottom: 5,
  },

  pinkStep: {
    backgroundColor: '#EDB7B0',
  },

  stepText: {
    color: '#30463E',
    fontSize: 17,
    letterSpacing: 1,
  },

  titlePaper: {
    alignSelf: 'center',
    backgroundColor: '#F7E8BD',
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 16,
  },

  title: {
    color: '#30463E',
    fontSize: 27,
  },

  redUnderline: {
    height: 3,
    marginTop: 10,
    borderRadius: 20,
    backgroundColor: '#EFA097',
  },

  descriptionPaper: {
    alignSelf: 'center',
    marginTop: 4,
    backgroundColor: '#FFFDF6',
    paddingHorizontal: 22,
    paddingVertical: 14,
  },

  descriptionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },

  description: {
    color: '#30463E',
    fontSize: 14,
    lineHeight: 23,
  },

  blueUnderline: {
    height: 3,
    width: '78%',
    alignSelf: 'center',
    marginTop: 7,
    backgroundColor: '#A6CADB',
  },

  sectionPaper: {
    marginTop: 22,
    paddingHorizontal: 16,
    paddingTop: 22,
    paddingBottom: 20,
    backgroundColor: '#FCF8EA',
    borderWidth: 1,
    borderColor: '#C6BAA5',
  },

  pinkTape: {
    position: 'absolute',
    width: 75,
    height: 22,
    top: -10,
    left: -7,
    opacity: 0.7,
    backgroundColor: '#E8A69E',
    transform: [{ rotate: '-9deg' }],
  },

  sectionHeading: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 15,
  },

  sectionLabel: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingHorizontal: 10,
    paddingVertical: 7,
    marginBottom: 16,
  },

  greenLabel: {
    backgroundColor: '#E4E8C8',
  },

  pinkLabel: {
    backgroundColor: '#F3C7C0',
  },

  blueLabel: {
    backgroundColor: '#C8E0E8',
  },

  sectionTitle: {
    color: '#30463E',
    fontSize: 18,
  },

  caption: {
    color: '#6E746E',
    fontSize: 12,
  },

  choices: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },

  choice: {
    minWidth: 92,
    flexGrow: 1,
    minHeight: 57,
    paddingHorizontal: 12,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFDF7',
    borderWidth: 1,
    borderColor: '#C9BCA7',
    borderRadius: 3,
  },

  choiceGreen: {
    backgroundColor: '#E7EACD',
    borderColor: '#A4B38F',
  },

  choicePink: {
    backgroundColor: '#F5C7C1',
    borderColor: '#E99A90',
  },

  choiceBlue: {
    backgroundColor: '#C6E1EE',
    borderColor: '#78AEC5',
  },

  choiceText: {
    color: '#394A42',
    fontSize: 14,
  },

  choiceTextSelected: {
  },

  choiceCheck: {
    position: 'absolute',
    top: -8,
    right: -6,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#A7B698',
    alignItems: 'center',
    justifyContent: 'center',
  },

  errorPaper: {
    marginTop: 20,
    marginHorizontal: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 15,
    paddingVertical: 13,
    backgroundColor: '#FFF7EF',
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#E49283',
  },

  errorText: {
    flex: 1,
    color: '#A95D54',
    fontSize: 13,
    lineHeight: 20,
  },

  submitButton: {
    marginTop: 24,
    marginHorizontal: 16,
    minHeight: 72,
    paddingHorizontal: 28,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 25,
    backgroundColor: '#8EC3DE',
    borderWidth: 1,
    borderColor: '#6BA7C5',
  },

  submitDisabled: {
    opacity: 0.45,
  },

  submitText: {
    color: '#30463E',
    fontSize: 20,
  },

  pressed: {
    opacity: 0.72,
  },
});