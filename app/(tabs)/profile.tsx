import Ionicons from '@expo/vector-icons/Ionicons';
import { Redirect, router } from 'expo-router';
import { useRef, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppText } from '@/components/common/app-text';
import { Avatar } from '@/components/common/avatar';
import { fonts, shadows, spacing } from '@/constants/theme';
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

  if (!currentUser) return <Redirect href="/onboarding" />;

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
      router.replace('/onboarding');
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
      <View pointerEvents="none" style={styles.paperLines}>
        {Array.from({ length: 30 }, (_, index) => <View key={index} style={styles.paperLine} />)}
      </View>
      <View pointerEvents="none" style={styles.marginLine} />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View style={styles.titleTape}>
            <AppText style={styles.titleEyebrow}>MY PROFILE</AppText>
            <AppText style={styles.title}>プロフィール</AppText>
          </View>
          <Pressable
            accessibilityLabel="プロフィールを編集"
            accessibilityRole="button"
            onPress={() => router.push('/profile-edit')}
            style={({ pressed }) => [styles.editButton, pressed && styles.editButtonPressed]}>
            <Ionicons color="#405348" name="create-outline" size={17} />
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
                  <Ionicons color="#E9D49A" name={stat.icon} size={18} />
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
              <Ionicons name="shield-checkmark-outline" size={22} color="#526B5E" />
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
  safeArea: { flex: 1, backgroundColor: '#F5EEDC' },
  paperLines: { ...StyleSheet.absoluteFillObject, top: 48 },
  paperLine: { height: 32, borderBottomWidth: 1, borderBottomColor: 'rgba(92,135,144,0.16)' },
  marginLine: { position: 'absolute', top: 0, bottom: 0, left: 28, width: 1, backgroundColor: 'rgba(194,94,74,0.28)' },
  content: { width: '100%', maxWidth: 560, alignSelf: 'center', paddingHorizontal: spacing.xl, paddingTop: spacing.xxl, paddingBottom: spacing.xxxl, gap: spacing.xxl },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.lg },
  titleTape: { minWidth: 180, paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, backgroundColor: 'rgba(180,207,169,0.72)', transform: [{ rotate: '-1deg' }] },
  titleEyebrow: { color: '#6D735E', fontSize: 8, lineHeight: 11, letterSpacing: 1.8 },
  title: { color: '#30483E', fontFamily: fonts?.rounded, fontSize: 23, lineHeight: 30 },
  editButton: { minHeight: 42, paddingHorizontal: spacing.md, flexDirection: 'row', alignItems: 'center', gap: spacing.xs, borderWidth: 1, borderColor: '#657568', borderRadius: 7, backgroundColor: 'rgba(255,251,237,0.86)' },
  editButtonPressed: { backgroundColor: '#E4E4D1', transform: [{ translateY: 1 }] },
  editButtonText: { color: '#405348', fontSize: 12, lineHeight: 17 },
  profileCardWrap: { position: 'relative', transform: [{ rotate: '0.25deg' }] },
  profileTape: { position: 'absolute', zIndex: 1, top: -10, left: '38%', width: 92, height: 22, backgroundColor: 'rgba(225,169,157,0.7)', transform: [{ rotate: '-1deg' }] },
  profileCard: { padding: spacing.xl, borderWidth: 1.5, borderColor: '#68766D', borderRadius: 13, backgroundColor: 'rgba(255,251,237,0.95)', ...shadows.surface },
  identity: { flexDirection: 'row', alignItems: 'center', gap: spacing.xl },
  avatarFrame: { padding: 5, borderWidth: 1, borderColor: '#758175', borderRadius: 50, backgroundColor: '#F1E7CE' },
  identityCopy: { flex: 1, minWidth: 0 },
  identityLabel: { color: '#9B5545', fontSize: 8, lineHeight: 12, letterSpacing: 1.6 },
  nickname: { marginTop: 1, color: '#30463C', fontFamily: fonts?.rounded, fontSize: 25, lineHeight: 33 },
  userTypeBadge: { alignSelf: 'flex-start', marginTop: spacing.sm, paddingHorizontal: 9, paddingVertical: 4, borderRadius: 4, backgroundColor: '#E2E8D7' },
  userTypeText: { color: '#586756', fontSize: 10, lineHeight: 14 },
  divider: { height: 1, marginVertical: spacing.lg, backgroundColor: 'rgba(104,118,109,0.28)' },
  aboutRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  aboutLabel: { color: '#9B5545', fontSize: 8, lineHeight: 12, letterSpacing: 1.4 },
  tags: { flex: 1, flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  tag: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 9, backgroundColor: '#DCE7E7' },
  tagText: { color: '#536B6B', fontSize: 9, lineHeight: 13 },
  bioNote: { position: 'relative', marginTop: spacing.lg, paddingHorizontal: spacing.lg, paddingVertical: spacing.md, borderLeftWidth: 3, borderLeftColor: '#D7B663', backgroundColor: '#FFF3C7' },
  bioPin: { position: 'absolute', top: 8, right: 10, width: 7, height: 7, borderRadius: 4, backgroundColor: '#C67C69' },
  bio: { paddingRight: spacing.lg, color: '#465249', fontSize: 13, lineHeight: 21 },
  bioEmpty: { color: '#8A8978', fontSize: 12, lineHeight: 19 },
  logSection: { gap: spacing.lg },
  sectionTitleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  sectionRule: { flex: 1, height: 1, backgroundColor: '#9C9A7A' },
  sectionTitle: { color: '#8B5948', fontSize: 10, lineHeight: 14, letterSpacing: 1.8 },
  logCard: { position: 'relative', overflow: 'hidden', flexDirection: 'row', flexWrap: 'wrap', borderWidth: 2, borderColor: '#39463D', borderRadius: 14, backgroundColor: '#5F6F62', ...shadows.surface },
  logTape: { position: 'absolute', zIndex: 1, top: -4, right: 24, width: 72, height: 14, backgroundColor: 'rgba(224,199,132,0.62)', transform: [{ rotate: '2deg' }] },
  stat: { width: '50%', minHeight: 104, padding: spacing.md, alignItems: 'center', justifyContent: 'center' },
  statRightBorder: { borderRightWidth: 1, borderRightColor: 'rgba(233,229,199,0.25)' },
  statBottomBorder: { borderBottomWidth: 1, borderBottomColor: 'rgba(233,229,199,0.25)' },
  statIcon: { width: 30, height: 30, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#9EAA94', borderRadius: 15, backgroundColor: '#435147' },
  statValue: { marginTop: 4, color: '#FFF1C8', fontFamily: fonts?.rounded, fontSize: 20, lineHeight: 26 },
  statLabel: { color: '#DDE2CF', fontSize: 9, lineHeight: 13 },
  privacyWrap: { position: 'relative', transform: [{ rotate: '-0.4deg' }] },
  privacyTape: { position: 'absolute', zIndex: 1, top: -8, left: 24, width: 68, height: 18, backgroundColor: 'rgba(155,196,213,0.7)', transform: [{ rotate: '-2deg' }] },
  privacy: { padding: spacing.lg, borderWidth: 1, borderColor: '#7B887D', borderStyle: 'dashed', borderRadius: 10, backgroundColor: 'rgba(255,251,237,0.9)', flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  privacyIcon: { width: 42, height: 42, alignItems: 'center', justifyContent: 'center', borderRadius: 21, backgroundColor: '#E2E8D8' },
  privacyCopy: { flex: 1 },
  privacyTitle: { color: '#405348', fontFamily: fonts?.rounded, fontSize: 13, lineHeight: 19 },
  privacyText: { marginTop: 3, color: '#74776B', fontSize: 10, lineHeight: 16 },
  reset: { minHeight: 44, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.xs },
  resetPressed: { opacity: 0.6 },
  resetText: { color: '#A5574C', fontSize: 11, lineHeight: 16 },
});
