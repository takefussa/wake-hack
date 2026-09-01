import Ionicons from '@expo/vector-icons/Ionicons';
import { Redirect, router } from 'expo-router';
import type { PropsWithChildren } from 'react';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppText } from '@/components/common/app-text';
import { Waveform } from '@/components/common/waveform';
import { fonts, paperColors, shadows, spacing } from '@/constants/theme';
import { useTapLock } from '@/hooks/use-tap-lock';
import { morningRequestService } from '@/services/morning-request-service';
import { profileService } from '@/services/profile-service';
import { useAppStore } from '@/store/use-app-store';
import type { MorningRequest, UserProfile, VoiceMessage } from '@/types';

function NotebookBackground({ children }: PropsWithChildren) {
  return (
    <SafeAreaView edges={['top']} style={styles.safeArea} testID="home-screen">
      <View pointerEvents="none" style={styles.paperLines}>
        {Array.from({ length: 24 }, (_, index) => <View key={index} style={styles.paperLine} />)}
      </View>
      <View pointerEvents="none" style={styles.marginLine} />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {children}
      </ScrollView>
    </SafeAreaView>
  );
}

function MemoNote({ name }: { name: string }) {
  return (
    <View style={styles.memoWrap}>
      <View style={styles.tape} />
      <View style={styles.memo}>
        <AppText style={styles.memoGreeting}>こんばんは、{name}さん</AppText>
        <AppText style={styles.memoText}>明日も、いい朝にしよう</AppText>
        <View style={styles.memoUnderline} />
      </View>
    </View>
  );
}

type BoomboxCardProps = {
  request: MorningRequest | null;
  wakeVoice: VoiceMessage | null;
  onPress: () => void;
};

function getWakeDayDisplay(request: MorningRequest | null, now: Date) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Tokyo',
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    hourCycle: 'h23',
  }).formatToParts(now);
  const valueOf = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((part) => part.type === type)?.value);
  const today = new Date(Date.UTC(valueOf('year'), valueOf('month') - 1, valueOf('day')));
  const currentMinutes = valueOf('hour') * 60 + valueOf('minute');
  const [wakeHours = 0, wakeMinutes = 0] = request?.wakeAt.split(':').map(Number) ?? [];
  const isToday = request !== null && wakeHours * 60 + wakeMinutes > currentMinutes;

  if (!isToday) today.setUTCDate(today.getUTCDate() + 1);

  return {
    dateLabel: today
      .toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' })
      .toUpperCase(),
    relativeDayLabel: isToday ? 'TODAY' : 'TOMORROW',
  };
}

function BoomboxCard({ request, wakeVoice, onPress }: BoomboxCardProps) {
  const [now, setNow] = useState(() => new Date());
  const isReady = wakeVoice !== null;
  const { dateLabel, relativeDayLabel } = getWakeDayDisplay(request, now);
  const buttonLabel = request ? '朝を確認する' : '設定する';

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(timer);
  }, []);

  return (
    <View style={styles.boomboxShadow}>
      <View style={styles.boombox}>
        <View style={styles.boomboxTop}>
          <View>
            <AppText style={styles.brand}>オキル予定</AppText>
            <AppText style={styles.modelNumber}>{dateLabel} / {relativeDayLabel}</AppText>
          </View>
          <View style={styles.knobs}><View style={styles.knob} /><View style={styles.knob} /></View>
        </View>

        <View style={styles.boomboxBody}>
          <View style={styles.speaker}>
            <View style={styles.speakerInner}><Ionicons color={paperColors.orange} name="sunny" size={34} /></View>
          </View>
          <View style={styles.displayPanel}>
            <View style={styles.statusRow}>
              <View style={[styles.statusLight, isReady && styles.statusLightReady]} />
              <AppText style={styles.statusText}>
                {!request ? 'NOT SET' : isReady ? 'VOICE READY' : 'WAITING FOR VOICE'}
              </AppText>
            </View>
            <AppText style={styles.time}>{request?.wakeAt ?? '--:--'}</AppText>
            <AppText numberOfLines={1} style={styles.schedule}>
              {request ? request.schedules.join(' ・ ') : '明日の予定を録音しよう'}
            </AppText>
            {request ? (
              <AppText numberOfLines={1} style={styles.morningDetails}>
                {request.mood} ・ {request.preferredVoiceStyle}
              </AppText>
            ) : null}
            <View style={styles.waveformBox}>
              <Waveform color={isReady ? paperColors.ruleBlue : paperColors.statusGray} height={25} levels={[6, 12, 20, 9, 16, 23, 11, 18, 7, 14, 21, 9]} />
            </View>
          </View>
        </View>

        <Pressable accessibilityRole="button" onPress={onPress}
          style={({ pressed }) => [styles.actionButton, pressed && styles.actionButtonPressed]}>
          <View style={styles.playButton}><Ionicons color={paperColors.ink} name="play" size={17} /></View>
          <AppText style={styles.actionLabel}>{buttonLabel}</AppText>
          <Ionicons color={paperColors.ink} name="arrow-forward" size={19} />
        </Pressable>
      </View>
    </View>
  );
}

type TomorrowRecipient = {
  profile: UserProfile;
  request: MorningRequest | null;
};

type TomorrowWakeCardProps = {
  currentUserId: string;
  receiverIds: string[];
  givenVoices: VoiceMessage[];
  onPressTimeline: () => void;
};

function TomorrowWakeCard({
  currentUserId,
  receiverIds,
  givenVoices,
  onPressTimeline,
}: TomorrowWakeCardProps) {
  const [recipients, setRecipients] = useState<TomorrowRecipient[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function loadRecipients() {
      const recordedVoices = [...givenVoices]
        .reverse()
        .filter(
          (message) =>
            message.type === 'personal' &&
            message.senderId === currentUserId &&
            typeof message.receiverId === 'string' &&
            typeof message.morningRequestId === 'string' &&
            message.uri.trim().length > 0 &&
            message.durationMs > 0 &&
            receiverIds.includes(message.receiverId)
        )
        .filter(
          (message, index, messages) =>
            messages.findIndex((item) => item.receiverId === message.receiverId) === index
        );

      if (recordedVoices.length === 0) {
        setRecipients([]);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      const loaded = await Promise.all(
        recordedVoices.map(async (voice) => {
          const receiverId = voice.receiverId as string;
          const [profile, request] = await Promise.all([
            profileService.getProfile(receiverId),
            morningRequestService.getRequest(voice.morningRequestId as string),
          ]);

          return profile ? { profile, request } : null;
        })
      );

      if (!isMounted) return;
      setRecipients(
        loaded.filter((recipient): recipient is TomorrowRecipient => recipient !== null)
      );
      setIsLoading(false);
    }

    void loadRecipients();
    return () => {
      isMounted = false;
    };
  }, [currentUserId, givenVoices, receiverIds]);

  return (
    <View style={styles.wakePlanWrap}>
      <View pointerEvents="none" style={styles.wakePlanTape} />
      <View style={styles.wakePlanCard}>
        <View style={styles.wakePlanHeader}>
          <View>
            <AppText style={styles.wakePlanEyebrow}>VOICE DELIVERY / TOMORROW</AppText>
            <AppText style={styles.wakePlanTitle}>明日起こす人</AppText>
          </View>
          <View style={styles.wakePlanCount}>
            <Ionicons color={paperColors.ink} name="mic" size={13} />
            <AppText style={styles.wakePlanCountText}>{recipients.length}人</AppText>
          </View>
        </View>

        {isLoading ? (
          <View style={styles.wakePlanEmpty}>
            <AppText style={styles.wakePlanEmptyText}>予定を読み込んでいます…</AppText>
          </View>
        ) : recipients.length > 0 ? (
          <View style={styles.recipientList}>
            {recipients.map(({ profile, request }, index) => (
              <View
                key={profile.id}
                style={[styles.recipientRow, index > 0 && styles.recipientRowBorder]}>
                <View style={styles.recipientAvatar}>
                  <AppText style={styles.recipientAvatarText}>
                    {profile.nickname.trim().slice(0, 1).toUpperCase()}
                  </AppText>
                </View>
                <View style={styles.recipientCopy}>
                  <AppText numberOfLines={1} style={styles.recipientName}>
                    {profile.nickname}さん
                  </AppText>
                  <View style={styles.recipientMetaRow}>
                    <Ionicons color={paperColors.ink} name="alarm-outline" size={14} />
                    <AppText style={styles.recipientTime}>{request?.wakeAt ?? '--:--'}</AppText>
                    <AppText numberOfLines={1} style={styles.recipientSchedule}>
                      {request?.schedules.join(' ・ ') || '明日の朝'}
                    </AppText>
                  </View>
                </View>
                <View style={styles.voiceReadyBadge}>
                  <Ionicons color={paperColors.ink} name="checkmark" size={12} />
                  <AppText style={styles.voiceReadyText}>準備済み</AppText>
                </View>
              </View>
            ))}
          </View>
        ) : (
          <View style={styles.wakePlanEmpty}>
            <View style={styles.emptyIconCircle}>
              <Ionicons color={paperColors.ink} name="people-outline" size={21} />
            </View>
            <View style={styles.wakePlanEmptyCopy}>
              <AppText style={styles.wakePlanEmptyTitle}>まだ予定はありません</AppText>
              <AppText style={styles.wakePlanEmptyText}>
                タイムラインから、声を届ける相手を選ぼう。
              </AppText>
            </View>
          </View>
        )}

        <Pressable
          accessibilityRole="button"
          onPress={onPressTimeline}
          style={({ pressed }) => [styles.timelineLink, pressed && styles.timelineLinkPressed]}>
          <Ionicons color={paperColors.ink} name="radio-outline" size={16} />
          <AppText style={styles.timelineLinkText}>
            {recipients.length > 0 ? '起こすタイムラインを見る' : '起こす人を探す'}
          </AppText>
          <Ionicons color={paperColors.ink} name="arrow-forward" size={16} />
        </Pressable>
      </View>
    </View>
  );
}

function CassetteTimeline() {
  const steps = [
    { icon: 'moon-outline' as const, label: '夜', copy: '気持ちを預ける' },
    { icon: 'mic-outline' as const, label: '声', copy: '誰かの声が届く' },
    { icon: 'sunny-outline' as const, label: '朝', copy: '声と一緒に起きる' },
  ];
  return (
    <View style={styles.timeline}>
      <View style={styles.timelineTitleRow}>
        <View style={styles.titleRule} /><AppText style={styles.timelineTitle}>HOW IT WORKS</AppText><View style={styles.titleRule} />
      </View>
      <View style={styles.timelineTrack} />
      <View style={styles.timelineSteps}>
        {steps.map((step, index) => (
          <View key={step.label} style={styles.timelineStep}>
            <View style={styles.cassetteReel}><View style={styles.reelCenter}>
              <Ionicons color={paperColors.ink} name={step.icon} size={18} />
            </View></View>
            <AppText style={styles.stepNumber}>0{index + 1} / {step.label}</AppText>
            <AppText style={styles.stepCopy}>{step.copy}</AppText>
          </View>
        ))}
      </View>
    </View>
  );
}

export default function HomeScreen() {
  const currentUser = useAppStore((state) => state.currentUser);
  const currentMorningRequest = useAppStore((state) => state.currentMorningRequest);
  const assignedWakeVoice = useAppStore((state) => state.assignedWakeVoice);
  const currentGiveReceiverIds = useAppStore((state) => state.currentGiveReceiverIds);
  const givenVoiceMessages = useAppStore((state) => state.givenVoiceMessages);
  const runOnce = useTapLock();

  if (!currentUser) return <Redirect href="/onboarding" />;

  function handleMorningAction() {
    runOnce(() =>
      router.push(
        currentMorningRequest ? '/morning/summary' : '/morning/setup'
      )
    );
  }

  return (
    <NotebookBackground>
      <MemoNote name={currentUser.nickname} />
      <BoomboxCard request={currentMorningRequest} wakeVoice={assignedWakeVoice} onPress={handleMorningAction} />
      <TomorrowWakeCard
        currentUserId={currentUser.id}
        receiverIds={currentGiveReceiverIds}
        givenVoices={givenVoiceMessages}
        onPressTimeline={() => runOnce(() => router.push('/(tabs)/connections'))}
      />
      <CassetteTimeline />
    </NotebookBackground>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: paperColors.base },
  paperLines: { ...StyleSheet.absoluteFillObject, top: 48 },
  paperLine: { height: 32, borderBottomWidth: 1, borderBottomColor: paperColors.ruleBlue },
  marginLine: { position: 'absolute', top: 0, bottom: 0, left: 28, width: 1, backgroundColor: paperColors.salmon },
  content: { width: '100%', maxWidth: 560, alignSelf: 'center', paddingHorizontal: spacing.xl, paddingTop: spacing.xxxl, paddingBottom: spacing.xxxl, gap: spacing.xxl },
  memoWrap: { alignSelf: 'center', width: '92%', transform: [{ rotate: '-1.5deg' }] },
  tape: { position: 'absolute', zIndex: 1, top: -10, left: '37%', width: 78, height: 22, backgroundColor: paperColors.tape, transform: [{ rotate: '2deg' }] },
  memo: { paddingVertical: spacing.xl, paddingHorizontal: spacing.lg, borderWidth: 1, borderColor: paperColors.ink, backgroundColor: paperColors.paleYellow, alignItems: 'center' },
  memoGreeting: { color: paperColors.ink, fontFamily: fonts?.rounded, fontSize: 14, lineHeight: 21, marginBottom: spacing.xs },
  memoText: { color: paperColors.ink, fontFamily: fonts?.rounded, fontSize: 22, lineHeight: 30, textAlign: 'center' },
  memoUnderline: { alignSelf: 'center', width: 176, height: 4, marginTop: 5, backgroundColor: paperColors.ruleBlue },
  boomboxShadow: { borderRadius: 18, backgroundColor: paperColors.statusGray, paddingBottom: 6, transform: [{ rotate: '0.4deg' }] },
  boombox: { padding: spacing.lg, borderWidth: 2, borderColor: paperColors.ink, borderRadius: 18, backgroundColor: paperColors.clockGray, gap: spacing.lg },
  boomboxTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  brand: { color: paperColors.ink, fontFamily: fonts?.rounded, fontSize: 17, lineHeight: 22, letterSpacing: 1.2 },
  modelNumber: { color: paperColors.ink, fontSize: 8, lineHeight: 12, letterSpacing: 1 },
  knobs: { flexDirection: 'row', gap: spacing.md },
  knob: { width: 21, height: 21, borderWidth: 2, borderColor: paperColors.ink, borderRadius: 11, backgroundColor: paperColors.tape },
  boomboxBody: { flexDirection: 'row', alignItems: 'center', gap: spacing.lg },
  speaker: { width: 92, height: 92, padding: 8, borderWidth: 2, borderColor: paperColors.ink, borderRadius: 46, backgroundColor: paperColors.olive },
  speakerInner: { flex: 1, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: paperColors.ink, borderRadius: 40, backgroundColor: paperColors.base },
  displayPanel: { flex: 1, minHeight: 126, padding: spacing.md, borderWidth: 2, borderColor: paperColors.ink, borderRadius: 6, backgroundColor: paperColors.noteBlue },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  statusLight: { width: 6, height: 6, borderRadius: 3, backgroundColor: paperColors.orange },
  statusLightReady: { backgroundColor: paperColors.olive },
  statusText: { color: paperColors.ink, fontSize: 8, lineHeight: 11, letterSpacing: 1 },
  time: { color: paperColors.ink, fontFamily: fonts?.rounded, fontSize: 35, lineHeight: 41, letterSpacing: 2 },
  schedule: { color: paperColors.ink, fontSize: 10, lineHeight: 14 },
  morningDetails: { color: paperColors.ink, fontSize: 9, lineHeight: 13, marginTop: 2 },
  waveformBox: { marginTop: spacing.sm, overflow: 'hidden' },
  actionButton: { minHeight: 58, paddingHorizontal: spacing.md, borderWidth: 2, borderColor: paperColors.ink, borderRadius: 9, backgroundColor: paperColors.salmon, flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  actionButtonPressed: { backgroundColor: paperColors.statusGray, transform: [{ translateY: 1 }] },
  playButton: { width: 31, height: 31, borderWidth: 1, borderColor: paperColors.ink, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  actionLabel: { flex: 1, color: paperColors.ink, fontFamily: fonts?.rounded, fontSize: 20, lineHeight: 26 },
  wakePlanWrap: { position: 'relative', marginTop: spacing.xs, borderRadius: 3, backgroundColor: paperColors.base, ...shadows.paper },
  wakePlanTape: { position: 'absolute', zIndex: 1, top: -9, right: 28, width: 82, height: 20, backgroundColor: paperColors.tape, transform: [{ rotate: '1.5deg' }] },
  wakePlanCard: { overflow: 'hidden', borderWidth: 2, borderColor: paperColors.ink, borderRadius: 2, backgroundColor: paperColors.base },
  wakePlanHeader: { minHeight: 70, paddingHorizontal: spacing.lg, paddingTop: spacing.lg, paddingBottom: spacing.md, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: paperColors.ink },
  wakePlanEyebrow: { color: paperColors.ink, fontSize: 8, lineHeight: 12, letterSpacing: 1.3 },
  wakePlanTitle: { marginTop: 2, color: paperColors.ink, fontFamily: fonts?.rounded, fontSize: 26, lineHeight: 33 },
  wakePlanCount: { minWidth: 48, height: 28, paddingHorizontal: spacing.sm, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, borderRadius: 14, backgroundColor: paperColors.noteBlue },
  wakePlanCountText: { color: paperColors.ink, fontSize: 11, lineHeight: 15 },
  recipientList: { paddingHorizontal: spacing.lg },
  recipientRow: { minHeight: 72, flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  recipientRowBorder: { borderTopWidth: 1, borderTopColor: paperColors.ink, borderStyle: 'dashed' },
  recipientAvatar: { width: 46, height: 46, borderWidth: 1, borderColor: paperColors.ink, borderRadius: 23, backgroundColor: paperColors.olive, alignItems: 'center', justifyContent: 'center' },
  recipientAvatarText: { color: paperColors.ink, fontFamily: fonts?.rounded, fontSize: 16, lineHeight: 21 },
  recipientCopy: { flex: 1, minWidth: 0 },
  recipientName: { color: paperColors.ink, fontFamily: fonts?.rounded, fontSize: 15, lineHeight: 21 },
  recipientMetaRow: { marginTop: 3, flexDirection: 'row', alignItems: 'center', gap: 5 },
  recipientTime: { color: paperColors.ink, fontSize: 12, lineHeight: 17 },
  recipientSchedule: { flex: 1, color: paperColors.ink, fontSize: 10, lineHeight: 15 },
  voiceReadyBadge: { paddingHorizontal: 7, paddingVertical: 4, flexDirection: 'row', alignItems: 'center', gap: 2, borderRadius: 10, backgroundColor: paperColors.salmon },
  voiceReadyText: { color: paperColors.ink, fontSize: 8, lineHeight: 11 },
  wakePlanEmpty: { minHeight: 76, paddingHorizontal: spacing.lg, paddingVertical: spacing.md, flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  emptyIconCircle: { width: 42, height: 42, borderWidth: 1, borderColor: paperColors.statusGray, borderRadius: 21, backgroundColor: paperColors.olive, alignItems: 'center', justifyContent: 'center' },
  wakePlanEmptyCopy: { flex: 1 },
  wakePlanEmptyTitle: { color: paperColors.ink, fontFamily: fonts?.rounded, fontSize: 16, lineHeight: 22 },
  wakePlanEmptyText: { color: paperColors.ink, fontSize: 12, lineHeight: 18 },
  timelineLink: { minHeight: 48, paddingHorizontal: spacing.lg, flexDirection: 'row', alignItems: 'center', gap: spacing.sm, borderTopWidth: 1, borderTopColor: paperColors.ink, backgroundColor: paperColors.base },
  timelineLinkPressed: { backgroundColor: paperColors.clockGray },
  timelineLinkText: { flex: 1, color: paperColors.ink, fontSize: 14, lineHeight: 20 },
  timeline: { position: 'relative', paddingTop: spacing.sm },
  timelineTitleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing.xl },
  titleRule: { flex: 1, height: 1, backgroundColor: paperColors.ruleBlue },
  timelineTitle: { color: paperColors.ink, fontSize: 10, lineHeight: 14, letterSpacing: 1.8 },
  timelineTrack: { position: 'absolute', top: 69, left: '16%', right: '16%', height: 2, backgroundColor: paperColors.ruleBlue },
  timelineSteps: { flexDirection: 'row', justifyContent: 'space-between' },
  timelineStep: { width: '31%', alignItems: 'center' },
  cassetteReel: { width: 54, height: 54, padding: 6, borderWidth: 2, borderColor: paperColors.ink, borderRadius: 27, backgroundColor: paperColors.noteBlue },
  reelCenter: { flex: 1, borderWidth: 1, borderColor: paperColors.ink, borderRadius: 20, backgroundColor: paperColors.base, alignItems: 'center', justifyContent: 'center' },
  stepNumber: { color: paperColors.ink, fontSize: 9, lineHeight: 13, letterSpacing: 1, marginTop: spacing.sm },
  stepCopy: { color: paperColors.ink, fontSize: 11, lineHeight: 16, textAlign: 'center', marginTop: 2 },
});
