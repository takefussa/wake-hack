import { Ionicons } from '@expo/vector-icons';
import { Redirect, router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useRef, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppText } from '@/components/common/app-text';
import { NotebookWallpaper } from '@/components/common/notebook-wallpaper';
import {
  moodOptions,
  scheduleOptions,
  voiceStyleOptions,
} from '@/constants/options';
import { prototypeConfig } from '@/constants/config';
import { paperColors, shadows } from '@/constants/theme';
import { demoMorningDefaults } from '@/data/demo-scenario';
import { toggleSchedule } from '@/features/morning/morning-request-form';
import { goBackOrReplace } from '@/features/navigation/go-back';
import { alarmService } from '@/services/alarm-service';
import { morningRequestService } from '@/services/morning-request-service';
import { useAppStore } from '@/store/use-app-store';
import type { MoodType, ScheduleType, VoiceStyle } from '@/types';

const customSchedulePrefix = 'その他：';

function isCustomSchedule(schedule: ScheduleType) {
  return schedule.startsWith(customSchedulePrefix);
}

function hasAlarmTimePassed(scheduledFor: string | undefined): boolean {
  if (!scheduledFor) return false;
  const scheduledForMs = new Date(scheduledFor).getTime();
  return Number.isFinite(scheduledForMs) && scheduledForMs <= Date.now();
}

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
  const currentMorningRequest = useAppStore((state) => state.currentMorningRequest);
  const setMorningRequest = useAppStore((state) => state.setMorningRequest);
  const replaceMorningRequest = useAppStore((state) => state.replaceMorningRequest);

  const savedSchedules =
    currentMorningRequest?.schedules ?? demoMorningDefaults.schedules;
  const [schedules, setSchedules] = useState<ScheduleType[]>(() =>
    savedSchedules.map((schedule) =>
      isCustomSchedule(schedule) ? 'その他' : schedule
    )
  );
  const [customSchedule, setCustomSchedule] = useState(
    () =>
      savedSchedules
        .find(isCustomSchedule)
        ?.slice(customSchedulePrefix.length) ?? ''
  );

  const [mood, setMood] = useState<MoodType | null>(
    currentMorningRequest?.mood ?? demoMorningDefaults.mood
  );

  const [voiceStyle, setVoiceStyle] = useState<VoiceStyle | null>(
    currentMorningRequest?.preferredVoiceStyle ?? demoMorningDefaults.preferredVoiceStyle
  );
  const [voiceRequestNote, setVoiceRequestNote] = useState(
    currentMorningRequest?.voiceRequestNote ?? ''
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
    (!schedules.includes('その他') || customSchedule.trim().length > 0) &&
    mood !== null &&
    voiceStyle !== null;

  async function handleSubmit() {
    if (!canSubmit || !mood || !voiceStyle || isSavingRef.current) return;

    isSavingRef.current = true;
    setIsSaving(true);
    setError(null);

    try {
      const normalizedSchedules = schedules.map((schedule) =>
        schedule === 'その他'
          ? `${customSchedulePrefix}${customSchedule.trim()}` as ScheduleType
          : schedule
      );
      const input = {
        wakeAt,
        schedules: normalizedSchedules,
        mood,
        preferredVoiceStyle: voiceStyle,
        voiceRequestNote: voiceRequestNote.trim() || undefined,
      };

      const startsNewMorning =
        !!currentMorningRequest &&
        (currentMorningRequest.status === 'completed' ||
          hasAlarmTimePassed(currentMorningRequest.scheduledFor));

      if (currentMorningRequest && startsNewMorning) {
        await morningRequestService.markCompleted(currentMorningRequest.id);
        // The previous Personal Voice is consumed once its alarm time has
        // passed. Remove its AlarmKit registration and local sound before
        // creating the next request.
        await alarmService.cancelScheduledAlarm();
      }

      const request =
        currentMorningRequest && !startsNewMorning
          ? await morningRequestService.updateRequest(currentMorningRequest, input)
          : await morningRequestService.createRequest(currentUserId, input);
      await alarmService.scheduleForRequest(request);

      if (currentMorningRequest && !startsNewMorning) {
        replaceMorningRequest(request);
        router.replace('/morning/summary');
      } else {
        setMorningRequest(request);
        router.replace('/morning/summary');
      }
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

      <NotebookWallpaper />

      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        style={styles.scroll}
      >
        <View style={styles.topNavigation}>
          <Pressable
            hitSlop={10}
            onPress={() => goBackOrReplace('/morning/setup')}
            style={styles.backButton}
          >
            <Ionicons name="chevron-back" size={25} color="#30463E" />
            <AppText style={styles.backText}>戻る</AppText>
          </Pressable>

          <Pressable
            accessibilityRole="button"
            disabled={isSaving}
            hitSlop={10}
            onPress={() => void handleSubmit()}
            style={({ pressed }) => [
              styles.skipButton,
              isSaving && styles.submitDisabled,
              pressed && styles.pressed,
            ]}
            testID="condition-skip"
          >
            <AppText style={styles.skipText}>スキップ</AppText>
          </Pressable>
        </View>

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
              <Ionicons name="leaf-outline" size={20} color={paperColors.ink} />
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

          {schedules.includes('その他') ? (
            <View style={styles.customSchedulePaper}>
              <AppText style={styles.customScheduleLabel}>
                その他の予定
              </AppText>
              <TextInput
                maxLength={40}
                onChangeText={setCustomSchedule}
                placeholder="例：病院、部活、友達と約束"
                placeholderTextColor="#979B91"
                returnKeyType="done"
                style={styles.customScheduleInput}
                testID="custom-schedule-input"
                value={customSchedule}
              />
            </View>
          ) : null}
        </View>

        <View style={styles.sectionPaper}>
          <View style={[styles.sectionLabel, styles.pinkLabel]}>
            <Ionicons name="heart-outline" size={20} color={paperColors.ink} />
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
            <Ionicons name="mic-outline" size={20} color={paperColors.ink} />
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

          <View style={styles.voiceNoteField}>
            <View style={styles.voiceNoteLabelRow}>
              <AppText style={styles.voiceNoteLabel}>一言</AppText>
              <AppText style={styles.caption}>任意</AppText>
              <AppText style={styles.voiceNoteCount}>
                {voiceRequestNote.length} / {prototypeConfig.morningVoiceNoteMaxLength}
              </AppText>
            </View>
            <TextInput
              accessibilityLabel="希望する声についての一言"
              maxLength={prototypeConfig.morningVoiceNoteMaxLength}
              multiline
              onChangeText={setVoiceRequestNote}
              placeholder="例：明日は発表なので、背中を押してほしい"
              placeholderTextColor="#8A918C"
              style={styles.voiceNoteInput}
              textAlignVertical="top"
              value={voiceRequestNote}
            />
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

      </ScrollView>

      <View style={styles.submitFooter}>
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
            {isSaving
              ? '保存しています…'
              : currentMorningRequest
                ? '編集を確定する'
                : '明日の朝を決める'}
          </AppText>

          {!isSaving ? (
            <Ionicons name="arrow-forward" size={28} color="#30463E" />
          ) : null}
        </Pressable>
      </View>
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
    left: 43,
    width: 1,
    backgroundColor: 'rgba(243, 196, 197, 0.80)',
  },

  content: {
    paddingHorizontal: 28,
    paddingTop: 12,
    paddingBottom: 28,
  },

  scroll: {
    flex: 1,
  },

  topNavigation: {
    minHeight: 36,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },

  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: -8,
  },

  backText: {
    color: '#30463E',
    fontSize: 17,
  },

  skipButton: {
    minHeight: 36,
    paddingHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },

  skipText: {
    color: '#30463E',
    fontSize: 14,
    borderBottomWidth: 2,
    borderBottomColor: paperColors.ruleBlue,
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
    backgroundColor: paperColors.tape,
  },

  stepText: {
    color: '#30463E',
    fontSize: 17,
    letterSpacing: 1,
  },

  titlePaper: {
    alignSelf: 'center',
    backgroundColor: 'transparent',
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
    backgroundColor: paperColors.ruleBlue,
  },

  descriptionPaper: {
    alignSelf: 'center',
    marginTop: 4,
    backgroundColor: '#FFFDF8',
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
    backgroundColor: '#AECBE2',
  },

  sectionPaper: {
    marginTop: 22,
    paddingHorizontal: 16,
    paddingTop: 22,
    paddingBottom: 20,
    backgroundColor: paperColors.base,
    borderWidth: 2,
    borderColor: paperColors.ink,
    borderRadius: 12,
    ...shadows.paper,
  },

  pinkTape: {
    position: 'absolute',
    width: 75,
    height: 22,
    top: -10,
    left: -7,
    backgroundColor: paperColors.tape,
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
    backgroundColor: paperColors.noteBlue,
  },

  pinkLabel: {
    backgroundColor: paperColors.noteBlue,
  },

  blueLabel: {
    backgroundColor: paperColors.noteBlue,
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

  voiceNoteField: {
    marginTop: 18,
    padding: 12,
    backgroundColor: paperColors.noteBlue,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: paperColors.ink,
  },

  voiceNoteLabelRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
    marginBottom: 8,
  },

  voiceNoteLabel: {
    color: '#30463E',
    fontSize: 16,
  },

  voiceNoteCount: {
    marginLeft: 'auto',
    color: '#6E746E',
    fontSize: 12,
  },

  voiceNoteInput: {
    minHeight: 72,
    paddingHorizontal: 13,
    paddingVertical: 11,
    color: '#30463E',
    fontSize: 16,
    lineHeight: 23,
    fontFamily: 'Tegaki851',
    backgroundColor: '#FFFDF8',
    borderWidth: 1,
    borderColor: '#B9B5A5',
  },

  choice: {
    minWidth: 92,
    flexGrow: 1,
    minHeight: 57,
    paddingHorizontal: 12,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFDF8',
    borderWidth: 1,
    borderColor: '#C9BCA7',
    borderRadius: 3,
  },

  choiceGreen: {
    backgroundColor: paperColors.noteBlue,
    borderColor: paperColors.ruleBlue,
  },

  choicePink: {
    backgroundColor: paperColors.noteBlue,
    borderColor: paperColors.ruleBlue,
  },

  choiceBlue: {
    backgroundColor: paperColors.noteBlue,
    borderColor: paperColors.ruleBlue,
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
    backgroundColor: paperColors.ruleBlue,
    alignItems: 'center',
    justifyContent: 'center',
  },

  customSchedulePaper: {
    marginTop: 14,
    padding: 12,
    backgroundColor: paperColors.noteBlue,
    borderWidth: 2,
    borderStyle: 'solid',
    borderColor: paperColors.ink,
  },

  customScheduleLabel: {
    marginBottom: 7,
    color: '#566259',
    fontSize: 13,
  },

  customScheduleInput: {
    minHeight: 48,
    paddingHorizontal: 13,
    color: '#30463E',
    fontSize: 16,
    fontFamily: 'Tegaki851',
    backgroundColor: '#FFFDF8',
    borderWidth: 1,
    borderColor: '#B9B5A5',
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
    backgroundColor: '#FFFDF8',
    borderWidth: 1,
    borderStyle: 'solid',
    borderColor: '#E49283',
  },

  errorText: {
    flex: 1,
    color: '#A95D54',
    fontSize: 13,
    lineHeight: 20,
  },

  submitFooter: {
    paddingHorizontal: 28,
    paddingTop: 10,
    paddingBottom: 10,
    backgroundColor: paperColors.base,
    borderTopWidth: 1,
    borderTopColor: paperColors.ruleBlue,
  },

  submitButton: {
    minHeight: 62,
    paddingHorizontal: 28,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 25,
    backgroundColor: '#F3C4C5',
    borderWidth: 2,
    borderColor: paperColors.ink,
    ...shadows.paper,
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
