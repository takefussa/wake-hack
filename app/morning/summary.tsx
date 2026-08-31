import Ionicons from '@expo/vector-icons/Ionicons';
import { Redirect, router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppText } from '@/components/common/app-text';
import { useTapLock } from '@/hooks/use-tap-lock';
import { useAppStore } from '@/store/use-app-store';

type SummaryRowProps = {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
};

function SummaryRow({ icon, label, value }: SummaryRowProps) {
  return (
    <View style={styles.summaryRow}>
      <View style={styles.rowIcon}>
        <Ionicons color="#51675D" name={icon} size={20} />
      </View>
      <View style={styles.rowCopy}>
        <AppText style={styles.rowLabel}>{label}</AppText>
        <AppText style={styles.rowValue}>{value}</AppText>
      </View>
    </View>
  );
}

export default function MorningSummaryScreen() {
  const currentUser = useAppStore((state) => state.currentUser);
  const currentMorningRequest = useAppStore(
    (state) => state.currentMorningRequest
  );
  const assignedWakeVoice = useAppStore((state) => state.assignedWakeVoice);
  const runOnce = useTapLock();

  if (!currentUser) {
    return <Redirect href="/onboarding" />;
  }

  if (!currentMorningRequest) {
    return <Redirect href="/morning/setup" />;
  }

  return (
    <SafeAreaView style={styles.safeArea} testID="morning-summary-screen">
      <StatusBar style="dark" />

      <View pointerEvents="none" style={StyleSheet.absoluteFill}>
        {Array.from({ length: 32 }).map((_, index) => (
          <View
            key={index}
            style={[styles.paperLine, { top: 32 + index * 32 }]}
          />
        ))}
        <View style={styles.marginLine} />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.navigation}>
          <Pressable
            hitSlop={10}
            onPress={() => runOnce(() => router.replace('/(tabs)'))}
            style={styles.backButton}
          >
            <Ionicons color="#30463E" name="chevron-back" size={25} />
            <AppText style={styles.backText}>ホーム</AppText>
          </Pressable>

          <Pressable
            accessibilityRole="button"
            hitSlop={10}
            onPress={() => runOnce(() => router.push('/morning/setup'))}
            style={({ pressed }) => [
              styles.editLink,
              pressed && styles.linkPressed,
            ]}
            testID="morning-summary-edit"
          >
            <Ionicons color="#56665E" name="create-outline" size={17} />
            <AppText style={styles.editLinkText}>編集する</AppText>
          </Pressable>
        </View>

        <View style={styles.headingTape}>
          <AppText style={styles.headingTapeText}>明日の朝</AppText>
        </View>

        <View style={styles.titleArea}>
          <AppText style={styles.title}>準備した内容</AppText>
          <View style={styles.titleUnderline} />
          <AppText style={styles.description}>
            明日の朝は、こんな予定になっています。
          </AppText>
        </View>

        <View style={styles.summaryPaper}>
          <View style={styles.blueTape} />
          <View style={styles.timeBlock}>
            <AppText style={styles.timeLabel}>起きる時間</AppText>
            <AppText style={styles.time}>{currentMorningRequest.wakeAt}</AppText>
          </View>

          <View style={styles.divider} />

          <SummaryRow
            icon="calendar-outline"
            label="明日の予定"
            value={currentMorningRequest.schedules.join(' ・ ')}
          />
          <SummaryRow
            icon="heart-outline"
            label="今の気分"
            value={currentMorningRequest.mood}
          />
          <SummaryRow
            icon="mic-outline"
            label="希望する声"
            value={currentMorningRequest.preferredVoiceStyle}
          />
        </View>

        <View style={styles.voiceNote}>
          <Ionicons
            color={assignedWakeVoice ? '#66835F' : '#9A765B'}
            name={assignedWakeVoice ? 'checkmark-circle-outline' : 'time-outline'}
            size={21}
          />
          <AppText style={styles.voiceNoteText}>
            {assignedWakeVoice
              ? '朝に届く声も準備できています。'
              : '朝に届く声を待っています。'}
          </AppText>
        </View>

        <Pressable
          accessibilityRole="button"
          onPress={() =>
            runOnce(() =>
              router.replace(
                assignedWakeVoice ? '/(tabs)' : '/(tabs)/timeline'
              )
            )
          }
          style={({ pressed }) => [
            styles.nextButton,
            pressed && styles.nextButtonPressed,
          ]}
          testID="morning-summary-next"
        >
          <AppText style={styles.nextButtonText}>
            {assignedWakeVoice ? 'ホームへ戻る' : 'タイムラインへ'}
          </AppText>
          <Ionicons color="#30463E" name="arrow-forward" size={22} />
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
    width: '100%',
    maxWidth: 560,
    alignSelf: 'center',
    paddingHorizontal: 28,
    paddingTop: 12,
    paddingBottom: 44,
  },
  navigation: {
    minHeight: 40,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    minHeight: 40,
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: -8,
  },
  backText: {
    color: '#30463E',
    fontSize: 16,
  },
  editLink: {
    minHeight: 36,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 4,
  },
  editLinkText: {
    color: '#56665E',
    fontSize: 14,
    borderBottomWidth: 2,
    borderBottomColor: '#EDB7B0',
  },
  linkPressed: {
    opacity: 0.58,
  },
  headingTape: {
    alignSelf: 'flex-start',
    marginTop: 20,
    marginLeft: 18,
    paddingHorizontal: 20,
    paddingVertical: 9,
    backgroundColor: '#DDE7C8',
    transform: [{ rotate: '-1deg' }],
  },
  headingTapeText: {
    color: '#30463E',
    fontSize: 18,
    letterSpacing: 1,
  },
  titleArea: {
    alignItems: 'center',
    marginTop: 24,
  },
  title: {
    color: '#30463E',
    fontSize: 29,
  },
  titleUnderline: {
    width: 210,
    height: 5,
    marginTop: 7,
    borderRadius: 10,
    backgroundColor: 'rgba(239, 160, 151, 0.72)',
    transform: [{ rotate: '-1deg' }],
  },
  description: {
    marginTop: 14,
    color: '#5E685F',
    fontSize: 14,
    textAlign: 'center',
  },
  summaryPaper: {
    marginTop: 28,
    paddingHorizontal: 20,
    paddingTop: 30,
    paddingBottom: 18,
    backgroundColor: '#FFFDF5',
    borderWidth: 1,
    borderColor: '#AEB5AA',
  },
  blueTape: {
    position: 'absolute',
    top: -11,
    alignSelf: 'center',
    width: 96,
    height: 24,
    backgroundColor: 'rgba(142, 195, 222, 0.68)',
  },
  timeBlock: {
    alignItems: 'center',
    paddingBottom: 20,
  },
  timeLabel: {
    color: '#657169',
    fontSize: 13,
  },
  time: {
    marginTop: 2,
    color: '#30463E',
    fontSize: 53,
    lineHeight: 62,
    letterSpacing: 2,
  },
  divider: {
    height: 1,
    backgroundColor: '#D6D1C2',
  },
  summaryRow: {
    minHeight: 72,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(174, 181, 170, 0.45)',
  },
  rowIcon: {
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 19,
    backgroundColor: '#EEF0DC',
  },
  rowCopy: {
    flex: 1,
    marginLeft: 13,
  },
  rowLabel: {
    color: '#7A817A',
    fontSize: 12,
  },
  rowValue: {
    marginTop: 2,
    color: '#30463E',
    fontSize: 17,
  },
  voiceNote: {
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 9,
    marginTop: 18,
    paddingHorizontal: 14,
    backgroundColor: '#F7E8BD',
  },
  voiceNoteText: {
    color: '#526158',
    fontSize: 13,
  },
  nextButton: {
    minHeight: 62,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 18,
    marginTop: 22,
    marginHorizontal: 12,
    backgroundColor: '#8EC3DE',
    borderWidth: 1,
    borderColor: '#68A4C2',
  },
  nextButtonPressed: {
    opacity: 0.72,
    transform: [{ translateY: 1 }],
  },
  nextButtonText: {
    color: '#30463E',
    fontSize: 19,
  },
});
