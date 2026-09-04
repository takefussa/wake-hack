import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/common/app-text';
import { Avatar } from '@/components/common/avatar';
import { Waveform } from '@/components/common/waveform';
import { fonts, paperColors, shadows, spacing } from '@/constants/theme';
import type { OnboardingSceneType } from '@/data/onboarding-pages';

type OnboardingSceneProps = {
  scene: OnboardingSceneType;
};

function SceneLabel({ icon, children }: { icon: keyof typeof Ionicons.glyphMap; children: string }) {
  return (
    <View style={styles.sceneLabel}>
      <Ionicons color={paperColors.ink} name={icon} size={16} />
      <AppText style={styles.sceneLabelText}>{children}</AppText>
    </View>
  );
}

function Tape({ align = 'center' }: { align?: 'left' | 'center' | 'right' }) {
  return <View pointerEvents="none" style={[styles.tape, styles[`tape${align}`]]} />;
}

function SetupScene() {
  return (
    <View style={styles.stage}>
      <SceneLabel icon="moon-outline">夜の準備 1</SceneLabel>
      <View style={styles.mainCard}>
        <Tape align="left" />
        <View style={styles.cardHeading}>
          <View>
            <AppText style={styles.eyebrow}>明日の起床時刻</AppText>
            <AppText style={styles.setupTime}>07:00</AppText>
          </View>
          <View style={styles.clockIcon}>
            <Ionicons color={paperColors.ink} name="alarm-outline" size={31} />
          </View>
        </View>

        <View style={styles.divider} />
        <View style={styles.settingRows}>
          <View style={styles.settingRow}>
            <AppText style={styles.settingLabel}>予定</AppText>
            <View style={styles.blueChip}><AppText style={styles.chipText}>発表</AppText></View>
            <View style={styles.blueChip}><AppText style={styles.chipText}>1限</AppText></View>
          </View>
          <View style={styles.settingRow}>
            <AppText style={styles.settingLabel}>気分</AppText>
            <View style={styles.yellowChip}><AppText style={styles.chipText}>少し緊張</AppText></View>
          </View>
          <View style={styles.requestNote}>
            <Ionicons color={paperColors.ink} name="chatbubble-outline" size={16} />
            <AppText style={styles.requestNoteText}>明るく背中を押してほしい</AppText>
          </View>
        </View>
        <View style={styles.mockButton}>
          <AppText style={styles.mockButtonText}>明日の朝を設定する</AppText>
          <Ionicons color={paperColors.ink} name="arrow-forward" size={19} />
        </View>
      </View>
    </View>
  );
}

function GiveScene() {
  return (
    <View style={styles.stage}>
      <SceneLabel icon="moon-outline">夜の準備 2</SceneLabel>
      <View style={styles.timelineCard}>
        <Tape align="right" />
        <View style={styles.timelineHeading}>
          <AppText style={styles.eyebrow}>起こすタイムライン</AppText>
          <AppText style={styles.timelineHint}>声を届ける相手を選ぶ</AppText>
        </View>
        <View style={styles.personRow}>
          <Avatar avatarId="sky" name="Takumi" size={48} />
          <View style={styles.personCopy}>
            <AppText style={styles.personName}>Takumiさん</AppText>
            <AppText style={styles.personMeta}>07:00 ・ 発表 ・ 緊張している</AppText>
          </View>
          <View style={styles.selectMark}>
            <Ionicons color={paperColors.ink} name="chevron-forward" size={18} />
          </View>
        </View>
      </View>

      <View style={styles.flowArrow}>
        <Ionicons color={paperColors.ink} name="arrow-down" size={23} />
      </View>

      <View style={styles.recordCard}>
        <View style={styles.recordTop}>
          <View style={styles.micCircle}>
            <Ionicons color={paperColors.ink} name="mic-outline" size={25} />
          </View>
          <View style={styles.recordCopy}>
            <AppText style={styles.recordTitle}>10秒の声を録音</AppText>
            <AppText style={styles.personMeta}>「発表、応援してるよ！」</AppText>
          </View>
          <AppText style={styles.recordTime}>00:10</AppText>
        </View>
        <View style={styles.waveform}>
          <Waveform color="#6EADD5" height={30} levels={[8, 19, 11, 27, 15, 22, 9, 25, 13, 20, 8]} />
        </View>
      </View>
    </View>
  );
}

function WakeScene() {
  return (
    <View style={styles.stage}>
      <SceneLabel icon="sunny-outline">朝 1</SceneLabel>
      <View style={styles.notificationCard}>
        <View style={styles.notificationIcon}>
          <Ionicons color={paperColors.ink} name="notifications-outline" size={25} />
        </View>
        <View style={styles.notificationCopy}>
          <AppText style={styles.notificationApp}>オキタ！</AppText>
          <AppText style={styles.notificationTitle}>あなたへの声を準備しました</AppText>
          <AppText style={styles.personMeta}>タップして朝を始めよう</AppText>
        </View>
        <AppText style={styles.notificationNow}>いま</AppText>
      </View>

      <View style={styles.wakeCard}>
        <Tape />
        <View style={styles.wakeTimeRow}>
          <View>
            <AppText style={styles.eyebrow}>GOOD MORNING</AppText>
            <AppText style={styles.wakeTime}>07:00</AppText>
          </View>
          <Ionicons color={paperColors.orange} name="sunny" size={48} />
        </View>
        <View style={styles.voicePlayer}>
          <Avatar avatarId="sunny" name="Takuma" size={45} />
          <View style={styles.personCopy}>
            <AppText style={styles.personName}>Takumaさんから</AppText>
            <Waveform color={paperColors.orange} height={22} levels={[7, 15, 10, 19, 12, 17, 8, 14]} />
          </View>
          <View style={styles.playCircle}>
            <Ionicons color={paperColors.ink} name="play" size={20} />
          </View>
        </View>
      </View>
    </View>
  );
}

function ThanksScene() {
  return (
    <View style={styles.stage}>
      <SceneLabel icon="sunny-outline">朝 2</SceneLabel>
      <View style={styles.completeCard}>
        <Tape align="right" />
        <View style={styles.completeMark}>
          <Ionicons color={paperColors.ink} name="checkmark" size={30} />
        </View>
        <AppText style={styles.completeTitle}>今日の朝を始められました</AppText>
        <View style={styles.completeRule} />
        <View style={styles.proofRow}>
          <Ionicons color={paperColors.orange} name="camera-outline" size={20} />
          <AppText style={styles.proofText}>オキタ証明を残す</AppText>
          <Ionicons color={paperColors.ink} name="checkmark-circle" size={18} />
        </View>
        <View style={styles.thanksBox}>
          <View style={styles.thanksHeading}>
            <Ionicons color={paperColors.ink} name="heart-outline" size={19} />
            <AppText style={styles.thanksTitle}>声をくれた人へ</AppText>
          </View>
          <AppText style={styles.thanksMessage}>「声のおかげで起きられた！ありがとう」</AppText>
          <View style={styles.thanksButton}>
            <AppText style={styles.thanksButtonText}>ありがとうを届ける</AppText>
            <Ionicons color={paperColors.ink} name="paper-plane-outline" size={17} />
          </View>
        </View>
      </View>
    </View>
  );
}

export function OnboardingScene({ scene }: OnboardingSceneProps) {
  if (scene === 'setup') return <SetupScene />;
  if (scene === 'give') return <GiveScene />;
  if (scene === 'wake') return <WakeScene />;
  return <ThanksScene />;
}

const styles = StyleSheet.create({
  stage: { minHeight: 370, paddingTop: 48, justifyContent: 'center' },
  sceneLabel: { position: 'absolute', top: 10, left: 8, paddingHorizontal: 14, paddingVertical: 7, flexDirection: 'row', alignItems: 'center', gap: 7, backgroundColor: paperColors.noteBlue, transform: [{ rotate: '-1deg' }] },
  sceneLabelText: { color: paperColors.ink, fontFamily: fonts?.handwritten, fontSize: 16, lineHeight: 21 },
  mainCard: { position: 'relative', padding: spacing.lg, borderWidth: 2, borderColor: paperColors.ink, borderRadius: 16, backgroundColor: '#FFFFFF', gap: spacing.md, ...shadows.paper },
  tape: { position: 'absolute', top: -11, width: 78, height: 22, zIndex: 2, backgroundColor: paperColors.tape, opacity: 0.82 },
  tapeleft: { left: 34, transform: [{ rotate: '-2deg' }] },
  tapecenter: { left: '50%', marginLeft: -39, transform: [{ rotate: '1deg' }] },
  taperight: { right: 34, transform: [{ rotate: '2deg' }] },
  cardHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  eyebrow: { color: paperColors.ink, fontSize: 11, lineHeight: 15, letterSpacing: 1.2 },
  setupTime: { marginTop: 2, color: paperColors.ink, fontFamily: fonts?.rounded, fontSize: 48, lineHeight: 54 },
  clockIcon: { width: 58, height: 58, borderWidth: 2, borderColor: paperColors.ink, borderRadius: 29, backgroundColor: paperColors.paleYellow, alignItems: 'center', justifyContent: 'center' },
  divider: { height: 1, backgroundColor: paperColors.clockGray },
  settingRows: { gap: spacing.sm },
  settingRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  settingLabel: { width: 40, color: paperColors.ink, fontSize: 12, lineHeight: 17 },
  blueChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, backgroundColor: paperColors.noteBlue },
  yellowChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, backgroundColor: paperColors.paleYellow },
  chipText: { color: paperColors.ink, fontSize: 12, lineHeight: 17 },
  requestNote: { padding: spacing.sm, flexDirection: 'row', alignItems: 'center', gap: spacing.sm, borderLeftWidth: 3, borderLeftColor: paperColors.salmon, backgroundColor: paperColors.base },
  requestNoteText: { color: paperColors.ink, fontSize: 12, lineHeight: 18 },
  mockButton: { minHeight: 46, paddingHorizontal: spacing.lg, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderWidth: 2, borderColor: paperColors.ink, borderRadius: 12, backgroundColor: paperColors.salmon },
  mockButtonText: { color: paperColors.ink, fontSize: 15, lineHeight: 21 },
  timelineCard: { position: 'relative', padding: spacing.lg, gap: spacing.md, borderWidth: 2, borderColor: paperColors.ink, borderRadius: 16, backgroundColor: '#FFFFFF', ...shadows.paper },
  timelineHeading: { gap: 3 },
  timelineHint: { color: paperColors.ink, fontFamily: fonts?.handwritten, fontSize: 21, lineHeight: 27 },
  personRow: { paddingTop: spacing.md, flexDirection: 'row', alignItems: 'center', gap: spacing.md, borderTopWidth: 1, borderTopColor: paperColors.clockGray },
  personCopy: { flex: 1, minWidth: 0 },
  personName: { color: paperColors.ink, fontSize: 15, lineHeight: 21 },
  personMeta: { marginTop: 2, color: '#55585B', fontSize: 11, lineHeight: 16 },
  selectMark: { width: 31, height: 31, borderWidth: 1.5, borderColor: paperColors.ink, borderRadius: 16, backgroundColor: paperColors.salmon, alignItems: 'center', justifyContent: 'center' },
  flowArrow: { height: 36, alignItems: 'center', justifyContent: 'center' },
  recordCard: { padding: spacing.md, borderWidth: 2, borderColor: paperColors.ink, borderRadius: 16, backgroundColor: paperColors.cardGray, ...shadows.paper },
  recordTop: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  micCircle: { width: 46, height: 46, borderWidth: 2, borderColor: paperColors.ink, borderRadius: 23, backgroundColor: paperColors.paleYellow, alignItems: 'center', justifyContent: 'center' },
  recordCopy: { flex: 1 },
  recordTitle: { color: paperColors.ink, fontSize: 15, lineHeight: 21 },
  recordTime: { color: paperColors.ink, fontFamily: fonts?.rounded, fontSize: 18, lineHeight: 24 },
  waveform: { marginTop: spacing.sm, alignItems: 'center' },
  notificationCard: { marginHorizontal: spacing.sm, padding: spacing.md, flexDirection: 'row', alignItems: 'center', gap: spacing.sm, borderWidth: 1.5, borderColor: paperColors.ink, borderRadius: 17, backgroundColor: '#FFFFFF', ...shadows.paper },
  notificationIcon: { width: 44, height: 44, borderRadius: 12, backgroundColor: paperColors.salmon, alignItems: 'center', justifyContent: 'center' },
  notificationCopy: { flex: 1 },
  notificationApp: { color: paperColors.ink, fontSize: 11, lineHeight: 15 },
  notificationTitle: { marginTop: 1, color: paperColors.ink, fontSize: 13, lineHeight: 19 },
  notificationNow: { alignSelf: 'flex-start', color: '#73777A', fontSize: 10, lineHeight: 14 },
  wakeCard: { position: 'relative', marginTop: spacing.xl, padding: spacing.lg, gap: spacing.lg, borderWidth: 2, borderColor: paperColors.ink, borderRadius: 18, backgroundColor: paperColors.paleYellow, ...shadows.paper },
  wakeTimeRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  wakeTime: { marginTop: 2, color: paperColors.ink, fontFamily: fonts?.rounded, fontSize: 43, lineHeight: 49 },
  voicePlayer: { padding: spacing.md, flexDirection: 'row', alignItems: 'center', gap: spacing.sm, borderWidth: 1.5, borderColor: paperColors.ink, borderRadius: 14, backgroundColor: '#FFFFFF' },
  playCircle: { width: 39, height: 39, borderWidth: 1.5, borderColor: paperColors.ink, borderRadius: 20, backgroundColor: paperColors.orange, alignItems: 'center', justifyContent: 'center' },
  completeCard: { position: 'relative', padding: spacing.lg, alignItems: 'center', gap: spacing.sm, borderWidth: 2, borderColor: paperColors.ink, borderRadius: 18, backgroundColor: '#FFFFFF', ...shadows.paper },
  completeMark: { width: 58, height: 58, borderWidth: 2, borderColor: paperColors.ink, borderRadius: 29, backgroundColor: paperColors.olive, alignItems: 'center', justifyContent: 'center' },
  completeTitle: { marginTop: spacing.xs, color: paperColors.ink, fontFamily: fonts?.handwritten, fontSize: 22, lineHeight: 29, textAlign: 'center' },
  completeRule: { width: 190, height: 5, borderRadius: 3, backgroundColor: paperColors.ruleBlue },
  proofRow: { width: '100%', paddingHorizontal: spacing.md, paddingVertical: spacing.sm, flexDirection: 'row', alignItems: 'center', gap: spacing.sm, borderRadius: 10, backgroundColor: paperColors.paleYellow },
  proofText: { flex: 1, color: paperColors.ink, fontSize: 13, lineHeight: 19 },
  thanksBox: { width: '100%', marginTop: spacing.xs, padding: spacing.md, gap: spacing.sm, borderWidth: 1.5, borderColor: paperColors.ink, borderRadius: 13, backgroundColor: paperColors.cardGray },
  thanksHeading: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  thanksTitle: { color: paperColors.ink, fontSize: 14, lineHeight: 20 },
  thanksMessage: { color: paperColors.ink, fontSize: 12, lineHeight: 18 },
  thanksButton: { minHeight: 42, paddingHorizontal: spacing.md, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm, borderWidth: 1.5, borderColor: paperColors.ink, borderRadius: 10, backgroundColor: paperColors.orange },
  thanksButtonText: { color: '#FFFFFF', fontSize: 14, lineHeight: 20 },
});
