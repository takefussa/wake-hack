import Ionicons from '@expo/vector-icons/Ionicons';
import { Redirect, router } from 'expo-router';
import { useRef, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppText } from '@/components/common/app-text';
import { Avatar } from '@/components/common/avatar';
import { NotebookWallpaper } from '@/components/common/notebook-wallpaper';
import { fonts, paperColors, shadows, spacing } from '@/constants/theme';
import { onboardingRoute } from '@/features/navigation/onboarding-route';
import { alarmService } from '@/services/alarm-service';
import { morningRequestService } from '@/services/morning-request-service';
import { profileService } from '@/services/profile-service';
import { useAppStore } from '@/store/use-app-store';

export default function ProfileScreen() {
  const currentUser = useAppStore((state) => state.currentUser);
  const friendships = useAppStore((state) => state.friendships);
  const givenVoiceMessages = useAppStore((state) => state.givenVoiceMessages);
  const wakeSession = useAppStore((state) => state.wakeSession);
  const resetPrototype = useAppStore((state) => state.resetPrototype);
  const [isResetting, setIsResetting] = useState(false);
  const isResettingRef = useRef(false);

  if (!currentUser) return <Redirect href={onboardingRoute} />;

  const matchedFriendCount = friendships.filter(
    (friendship) => friendship.status === 'matched'
  ).length;
  const completedMorningCount = wakeSession?.status === 'completed' ? 1 : 0;
  const stats = [
    { icon: 'mic-outline' as const, value: `${givenVoiceMessages.length}人`, label: '声を届けた' },
    { icon: 'sunny-outline' as const, value: `${completedMorningCount}回`, label: '起こしてもらった' },
    { icon: 'heart-outline' as const, value: `${matchedFriendCount}人`, label: 'オキメイト' },
    { icon: 'flame-outline' as const, value: `${completedMorningCount}日`, label: '連続起床' },
  ];

  async function performReset() {
    if (isResettingRef.current) return;
    isResettingRef.current = true;
    setIsResetting(true);
    try {
      await alarmService.cancelScheduledAlarm();
      await profileService.deleteCurrentProfile();
      await morningRequestService.resetPrototypeData();
      await resetPrototype();
      router.replace(onboardingRoute);
    } catch {
      isResettingRef.current = false;
      setIsResetting(false);
      Alert.alert('リセットできませんでした', 'もう一度お試しください。');
    }
  }

  function handleReset() {
    Alert.alert('プロトタイプをリセット', 'プロフィールと朝の状態を消して、最初から確認します。', [
      { text: 'キャンセル', style: 'cancel' },
      { text: 'リセット', style: 'destructive', onPress: () => void performReset() },
    ]);
  }

  return (
    <SafeAreaView edges={['top']} style={styles.safeArea} testID="profile-screen">
      <NotebookWallpaper />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View style={styles.titleTape}>
            <AppText style={styles.titleEyebrow}>MY PROFILE</AppText>
            <AppText style={styles.title}>プロフィール</AppText>
            <View style={styles.profileTitleUnderline} />
          </View>
          <Pressable
            accessibilityLabel="プロフィールを編集"
            accessibilityRole="button"
            onPress={() => router.push('/profile-edit')}
            style={({ pressed }) => [styles.editButton, pressed && styles.editButtonPressed]}>
            <Ionicons color={paperColors.ink} name="create-outline" size={18} />
            <AppText style={styles.editButtonText}>編集</AppText>
          </Pressable>
        </View>

        <View style={styles.profileCardWrap}>
          <View pointerEvents="none" style={styles.profileTape} />
          <View style={styles.profileCard}>
            <View style={styles.identity}>
              <View style={styles.avatarFrame}>
                <Avatar
                  avatarId={currentUser.avatarId}
                  imageUri={currentUser.profileImageUri}
                  name={currentUser.nickname}
                  size={84}
                />
              </View>
              <View style={styles.identityCopy}>
                <AppText style={styles.identityLabel}>NAME</AppText>
                <AppText numberOfLines={1} style={styles.nickname}>{currentUser.nickname}</AppText>
                <View style={styles.userTypeBadge}>
                  <AppText style={styles.userTypeText}>{currentUser.userType}</AppText>
                </View>
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.aboutRow}>
              <AppText style={styles.aboutLabel}>ABOUT ME</AppText>
              {currentUser.tags.length > 0 ? (
                <View style={styles.tags}>
                  {currentUser.tags.map((tag) => (
                    <View key={tag} style={styles.tag}>
                      <AppText style={styles.tagText}>#{tag}</AppText>
                    </View>
                  ))}
                </View>
              ) : null}
            </View>

            <View style={styles.bioNote}>
              <View style={styles.bioPin} />
              <AppText style={currentUser.bio ? styles.bio : styles.bioEmpty}>
                {currentUser.bio || '一言プロフィールはまだありません。'}
              </AppText>
            </View>
          </View>
        </View>

        <View style={styles.logSection}>
          <View style={styles.sectionTitleRow}>
            <View style={styles.sectionRule} />
            <AppText style={styles.sectionTitle}>MORNING LOG</AppText>
            <View style={styles.sectionRule} />
          </View>
          <View style={styles.logCard}>
            <View pointerEvents="none" style={styles.logTape} />
            {stats.map((stat, index) => (
              <View
                key={stat.label}
                style={[
                  styles.stat,
                  index % 2 === 0 && styles.statRightBorder,
                  index < 2 && styles.statBottomBorder,
                ]}>
                <View style={styles.statIcon}>
                  <Ionicons color={paperColors.ink} name={stat.icon} size={18} />
                </View>
                <AppText style={styles.statValue}>{stat.value}</AppText>
                <AppText style={styles.statLabel}>{stat.label}</AppText>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.privacyWrap}>
          <View pointerEvents="none" style={styles.privacyTape} />
          <View style={styles.privacy}>
            <View style={styles.privacyIcon}>
              <Ionicons name="shield-checkmark-outline" size={22} color={paperColors.ink} />
            </View>
            <View style={styles.privacyCopy}>
              <AppText style={styles.privacyTitle}>匿名でつながっています</AppText>
              <AppText style={styles.privacyText}>
                本名、学校名、会社名、詳しい住所は共有されません。
              </AppText>
            </View>
          </View>
        </View>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="プロトタイプをリセット"
          disabled={isResetting}
          onPress={handleReset}
          style={({ pressed }) => [styles.reset, pressed && styles.resetPressed]}>
          <Ionicons color="#A5574C" name="refresh-outline" size={15} />
          <AppText style={styles.resetText}>
            {isResetting ? 'リセットしています…' : 'プロトタイプをリセット'}
          </AppText>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: paperColors.base },
  content: { width: '100%', maxWidth: 560, alignSelf: 'center', paddingHorizontal: spacing.xl, paddingTop: spacing.xxl, paddingBottom: spacing.xxxl, gap: spacing.xxl },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.lg },
  titleTape: { minWidth: 180, paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, backgroundColor: 'transparent', transform: [{ rotate: '-1deg' }] },
  titleEyebrow: { color: paperColors.ink, fontSize: 10, lineHeight: 14, letterSpacing: 1.5 },
  title: { color: paperColors.ink, fontFamily: fonts?.rounded, fontSize: 23, lineHeight: 30 },
  profileTitleUnderline: { width: '100%', height: 5, marginTop: 3, borderRadius: 3, backgroundColor: paperColors.ruleBlue },
  editButton: { minHeight: 42, paddingHorizontal: spacing.md, flexDirection: 'row', alignItems: 'center', gap: spacing.xs, borderWidth: 1, borderColor: paperColors.ink, borderRadius: 7, backgroundColor: paperColors.salmon },
  editButtonPressed: { backgroundColor: '#E4ADB0', transform: [{ translateY: 1 }] },
  editButtonText: { color: paperColors.ink, fontSize: 14, lineHeight: 19 },
  profileCardWrap: { position: 'relative', transform: [{ rotate: '0.25deg' }] },
  profileTape: { position: 'absolute', zIndex: 1, top: -10, left: '38%', width: 92, height: 22, backgroundColor: paperColors.tape, transform: [{ rotate: '-1deg' }] },
  profileCard: { padding: spacing.xl, borderWidth: 2, borderColor: paperColors.ink, borderRadius: 13, backgroundColor: paperColors.base, ...shadows.paper },
  identity: { flexDirection: 'row', alignItems: 'center', gap: spacing.xl },
  avatarFrame: { padding: 5, borderWidth: 1, borderColor: paperColors.ink, borderRadius: 50, backgroundColor: paperColors.base },
  identityCopy: { flex: 1, minWidth: 0 },
  identityLabel: { color: paperColors.ink, fontSize: 10, lineHeight: 14, letterSpacing: 1.6 },
  nickname: { marginTop: 1, color: paperColors.ink, fontFamily: fonts?.rounded, fontSize: 25, lineHeight: 33 },
  userTypeBadge: { alignSelf: 'flex-start', marginTop: spacing.sm, paddingHorizontal: 9, paddingVertical: 4, borderRadius: 4, backgroundColor: paperColors.salmon },
  userTypeText: { color: paperColors.ink, fontSize: 12, lineHeight: 17 },
  divider: { height: 1, marginVertical: spacing.lg, backgroundColor: paperColors.statusGray },
  aboutRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  aboutLabel: { color: paperColors.ink, fontSize: 10, lineHeight: 14, letterSpacing: 1.4 },
  tags: { flex: 1, flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  tag: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 9, backgroundColor: paperColors.salmon },
  tagText: { color: paperColors.ink, fontSize: 11, lineHeight: 16 },
  bioNote: { position: 'relative', marginTop: spacing.lg, paddingHorizontal: spacing.lg, paddingVertical: spacing.md, borderLeftWidth: 4, borderLeftColor: paperColors.salmon, backgroundColor: paperColors.base },
  bioPin: { position: 'absolute', top: 8, right: 10, width: 7, height: 7, borderRadius: 4, backgroundColor: paperColors.salmon },
  bio: { paddingRight: spacing.lg, color: paperColors.ink, fontSize: 14, lineHeight: 22 },
  bioEmpty: { color: paperColors.ink, fontSize: 13, lineHeight: 21 },
  logSection: { gap: spacing.lg },
  sectionTitleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  sectionRule: { flex: 1, height: 1, backgroundColor: paperColors.ruleBlue },
  sectionTitle: { color: paperColors.ink, fontSize: 12, lineHeight: 17, letterSpacing: 1.8 },
  logCard: { position: 'relative', overflow: 'visible', flexDirection: 'row', flexWrap: 'wrap', borderWidth: 2, borderColor: paperColors.ink, borderRadius: 14, backgroundColor: paperColors.base, ...shadows.paper },
  logTape: { position: 'absolute', zIndex: 2, top: -11, right: 24, width: 72, height: 20, backgroundColor: paperColors.tape, transform: [{ rotate: '2deg' }] },
  stat: { width: '50%', minHeight: 104, padding: spacing.md, alignItems: 'center', justifyContent: 'center' },
  statRightBorder: { borderRightWidth: 1, borderRightColor: paperColors.ink },
  statBottomBorder: { borderBottomWidth: 1, borderBottomColor: paperColors.ink },
  statIcon: { width: 30, height: 30, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: paperColors.ink, borderRadius: 15, backgroundColor: paperColors.noteBlue },
  statValue: { marginTop: 4, color: paperColors.ink, fontFamily: fonts?.rounded, fontSize: 22, lineHeight: 28 },
  statLabel: { color: paperColors.ink, fontSize: 11, lineHeight: 16 },
  privacyWrap: { position: 'relative', transform: [{ rotate: '-0.4deg' }] },
  privacyTape: { position: 'absolute', zIndex: 1, top: -8, left: 24, width: 68, height: 18, backgroundColor: paperColors.tape, transform: [{ rotate: '-2deg' }] },
  privacy: { padding: spacing.lg, borderWidth: 2, borderColor: paperColors.ink, borderStyle: 'dashed', borderRadius: 10, backgroundColor: paperColors.clockGray, flexDirection: 'row', alignItems: 'center', gap: spacing.md, ...shadows.paper },
  privacyIcon: { width: 42, height: 42, alignItems: 'center', justifyContent: 'center', borderRadius: 21, backgroundColor: paperColors.olive },
  privacyCopy: { flex: 1 },
  privacyTitle: { color: paperColors.ink, fontFamily: fonts?.rounded, fontSize: 14, lineHeight: 20 },
  privacyText: { marginTop: 3, color: paperColors.ink, fontSize: 12, lineHeight: 18 },
  reset: { minHeight: 44, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.xs },
  resetPressed: { opacity: 0.6 },
  resetText: { color: '#A5574C', fontSize: 11, lineHeight: 16 },
});
