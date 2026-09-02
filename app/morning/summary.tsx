import Ionicons from '@expo/vector-icons/Ionicons';
import { Redirect, router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppText } from '@/components/common/app-text';
import { Avatar } from '@/components/common/avatar';
import { useAlarmSchedule } from '@/hooks/use-alarm-schedule';
import { useTapLock } from '@/hooks/use-tap-lock';
import { useVoiceSender } from '@/hooks/use-voice-sender';
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
  const alarmSchedule = useAlarmSchedule(currentMorningRequest);
  const preparedVoiceSender = useVoiceSender(
    alarmSchedule.preparedPersonalVoice
  );
  const hasPersonalAlarm =
    alarmSchedule.state.status === 'scheduled' &&
    alarmSchedule.state.alarm.sound === 'personal';

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

        <View
          style={[
            styles.alarmNote,
            alarmSchedule.state.status === 'scheduled' && styles.alarmNoteReady,
          ]}
          testID="alarm-status"
        >
          <Ionicons
            color={alarmSchedule.state.status === 'scheduled' ? '#66835F' : '#9A765B'}
            name={
              alarmSchedule.state.status === 'scheduled'
                ? 'alarm'
                : alarmSchedule.state.status === 'unavailable'
                  ? 'information-circle-outline'
                  : 'warning-outline'
            }
            size={21}
          />
          <View style={styles.alarmNoteCopy}>
            <AppText style={styles.alarmNoteTitle}>
              {alarmSchedule.state.status === 'scheduled'
                ? alarmSchedule.state.alarm.deliveryMode === 'native'
                  ? alarmSchedule.state.alarm.sound === 'personal'
                    ? '人の声アラームを設定しました'
                    : alarmSchedule.state.alarm.sound === 'community'
                      ? 'Community Voiceを設定しました'
                    : '実アラームを設定しました'
                  : '通知アラームを設定しました'
                : alarmSchedule.state.status === 'loading' ||
                    alarmSchedule.state.status === 'scheduling'
                  ? 'アラームを設定しています…'
                  : alarmSchedule.state.status === 'denied'
                    ? 'アラームの許可が必要です'
                  : alarmSchedule.state.status === 'expired'
                      ? '設定時刻を過ぎています'
                      : alarmSchedule.state.status === 'unavailable'
                        ? '実際のアラームはこの環境では利用できません'
                        : 'アラームを設定できませんでした'}
            </AppText>
            <AppText style={styles.alarmNoteText}>
              {alarmSchedule.state.status === 'scheduled'
                ? `${new Intl.DateTimeFormat('ja-JP', {
                    hour: '2-digit',
                    minute: '2-digit',
                  }).format(new Date(alarmSchedule.state.alarm.scheduledFor))} に${
                    alarmSchedule.state.alarm.deliveryMode === 'native'
                      ? alarmSchedule.state.alarm.sound === 'personal'
                        ? '届いた起床ボイスが停止するまで鳴ります。'
                        : alarmSchedule.state.alarm.sound === 'community'
                          ? 'Community Voiceが停止するまで鳴ります。'
                        : alarmSchedule.personalVoiceSyncStatus === 'error'
                          ? '標準音は設定済みですが、起床ボイスを取得できませんでした。'
                          : alarmSchedule.personalVoiceSyncStatus === 'checking'
                            ? '標準音を確保し、届いた起床ボイスを確認しています。'
                            : alarmSchedule.personalVoiceSyncStatus === 'waiting'
                              ? '標準音は設定済みです。寝る前にもう一度アプリを開くと、届いた声を確認します。'
                              : '停止するまで音が鳴ります。'
                      : '端末の通知音が1回鳴ります。'
                  }`
                : alarmSchedule.state.status === 'denied'
                  ? '端末の設定でアラームを許可してください。'
                  : alarmSchedule.state.status === 'expired'
                    ? '時刻を編集して、未来の時刻を選んでください。'
                    : alarmSchedule.state.status === 'unavailable'
                      ? 'Expo GoではAlarmKitだけを無効にしています。朝リクエストやWake Voiceの送受信は利用できます。'
                      : '再設定を試すか、端末の設定を確認してください。'}
            </AppText>
          </View>
        </View>

        {alarmSchedule.state.status === 'denied' ? (
          <Pressable
            accessibilityRole="button"
            onPress={() => void alarmSchedule.openSettings()}
            style={styles.alarmAction}
          >
            <AppText style={styles.alarmActionText}>端末の設定を開く</AppText>
          </Pressable>
        ) : alarmSchedule.state.status === 'error' ||
          alarmSchedule.personalVoiceSyncStatus === 'error' ? (
          <Pressable
            accessibilityRole="button"
            onPress={alarmSchedule.retry}
            style={styles.alarmAction}
          >
            <AppText style={styles.alarmActionText}>
              {alarmSchedule.state.status === 'error'
                ? 'アラームを再設定'
                : 'Wake Voiceを再確認'}
            </AppText>
          </Pressable>
        ) : null}

        {alarmSchedule.preparedPersonalVoice ? (
          <View style={styles.senderCard} testID="prepared-personal-voice">
            {preparedVoiceSender ? (
              <Avatar
                avatarId={preparedVoiceSender.avatarId}
                imageUri={preparedVoiceSender.profileImageUri}
                name={preparedVoiceSender.nickname}
                size={50}
              />
            ) : (
              <View style={styles.senderPlaceholder}>
                <Ionicons color="#66835F" name="person" size={23} />
              </View>
            )}
            <View style={styles.senderCopy}>
              <AppText style={styles.senderTitle}>
                {preparedVoiceSender
                  ? `${preparedVoiceSender.nickname}さんから明日のWake Voiceが届いています`
                  : '明日のWake Voiceが届いています'}
              </AppText>
              <AppText style={styles.senderDescription}>
                {alarmSchedule.isNativeAlarmAvailable
                  ? '内容は起床時まで再生できません。アラームに設定済みです。'
                  : '内容は起床前には再生できません。実アラームへの登録はDevelopment / Release Buildで行います。'}
              </AppText>
            </View>
          </View>
        ) : null}

        <View style={styles.voiceNote}>
          <Ionicons
            color={hasPersonalAlarm || assignedWakeVoice ? '#66835F' : '#9A765B'}
            name={
              hasPersonalAlarm || assignedWakeVoice
                ? 'checkmark-circle-outline'
                : 'time-outline'
            }
            size={21}
          />
          <AppText style={styles.voiceNoteText}>
            {alarmSchedule.state.status === 'unavailable'
              ? alarmSchedule.preparedPersonalVoice
                ? '届いた人の声を確認しました。実アラーム登録だけをこの環境ではスキップします。'
                : 'Wake Voiceを待っています。音声の送受信はこの環境でも利用できます。'
              : hasPersonalAlarm
              ? '届いた人の声を実機アラームに設定済みです。'
              : alarmSchedule.state.status === 'scheduled' &&
                  alarmSchedule.state.alarm.sound === 'community'
                ? '最新のCommunity Voiceを実機アラームに設定済みです。'
              : assignedWakeVoice
                ? '朝に届く声も準備できています。'
              : '朝に届く声を待っています。'}
          </AppText>
        </View>

        <Pressable
          accessibilityRole="button"
          onPress={() =>
            runOnce(() =>
              router.replace(
                assignedWakeVoice ? '/morning/ready' : '/(tabs)/connections'
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
            {assignedWakeVoice ? '朝の準備を見る' : 'タイムラインへ'}
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
  alarmNote: {
    minHeight: 76,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 18,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: '#F7E8BD',
    borderWidth: 1,
    borderColor: '#D7BE80',
  },
  alarmNoteReady: {
    backgroundColor: '#E7EFD9',
    borderColor: '#A8BC91',
  },
  alarmNoteCopy: {
    flex: 1,
  },
  alarmNoteTitle: {
    color: '#30463E',
    fontSize: 15,
  },
  alarmNoteText: {
    marginTop: 3,
    color: '#657169',
    fontSize: 12,
    lineHeight: 18,
  },
  alarmAction: {
    alignSelf: 'center',
    marginTop: 10,
    paddingHorizontal: 18,
    paddingVertical: 9,
    borderBottomWidth: 2,
    borderBottomColor: '#8EC3DE',
  },
  alarmActionText: {
    color: '#405348',
    fontSize: 14,
  },
  voiceNoteText: {
    color: '#526158',
    fontSize: 13,
  },
  senderCard: {
    minHeight: 88,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: '#FFFDF5',
    borderWidth: 1,
    borderColor: '#A8BC91',
  },
  senderPlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E7EFD9',
  },
  senderCopy: {
    flex: 1,
  },
  senderTitle: {
    color: '#30463E',
    fontSize: 14,
    lineHeight: 20,
  },
  senderDescription: {
    marginTop: 3,
    color: '#657169',
    fontSize: 11,
    lineHeight: 17,
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
