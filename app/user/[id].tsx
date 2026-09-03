import Ionicons from '@expo/vector-icons/Ionicons';
import { Redirect, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { onboardingRoute } from '@/features/navigation/onboarding-route';
import { AppText } from '@/components/common/app-text';
import { Avatar } from '@/components/common/avatar';
import { LoadingState } from '@/components/common/loading-state';
import { NotebookWallpaper } from '@/components/common/notebook-wallpaper';
import { ScreenHeader } from '@/components/common/screen-header';
import { paperColors, shadows, spacing } from '@/constants/theme';
import { goBackOrReplace } from '@/features/navigation/go-back';
import { morningRequestService } from '@/services/morning-request-service';
import { profileService } from '@/services/profile-service';
import { useAppStore } from '@/store/use-app-store';
import type { MorningRequest, UserProfile } from '@/types';

export default function UserProfileScreen() {
  const params = useLocalSearchParams<{ id?: string | string[] }>();
  const profileId = Array.isArray(params.id) ? params.id[0] : params.id;
  const currentUser = useAppStore((state) => state.currentUser);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [request, setRequest] = useState<MorningRequest | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!currentUser || !profileId) {
      setIsLoading(false);
      return;
    }
    const currentUserId = currentUser.id;
    const selectedProfileId = profileId;
    let isMounted = true;

    async function loadProfile() {
      try {
        const [nextProfile, requests] = await Promise.all([
          profileService.getProfile(selectedProfileId),
          morningRequestService.getAvailableRequests(currentUserId),
        ]);
        if (!isMounted) return;
        setProfile(nextProfile);
        setRequest(requests.find((item) => item.userId === selectedProfileId) ?? null);
        if (!nextProfile) setError('プロフィールが見つかりませんでした。');
      } catch {
        if (isMounted) setError('プロフィールを読み込めませんでした。');
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    void loadProfile();
    return () => {
      isMounted = false;
    };
  }, [currentUser, profileId]);

  if (!currentUser) return <Redirect href={onboardingRoute} />;

  return (
    <SafeAreaView edges={['top']} style={styles.safeArea} testID="user-profile-screen">
      <StatusBar style="dark" />
      <NotebookWallpaper />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <ScreenHeader onBack={() => goBackOrReplace('/(tabs)/connections')} title="プロフィール" />
        <View style={styles.headingUnderline} />

      {isLoading ? <LoadingState label="プロフィールを読み込んでいます" /> : null}
      {!isLoading && error && !profile ? <AppText style={styles.error}>{error}</AppText> : null}

      {!isLoading && profile ? (
        <>
          <View style={styles.profileCard}>
            <View pointerEvents="none" style={styles.tape} />
            <Avatar
              avatarId={profile.avatarId}
              imageUri={profile.profileImageUri}
              name={profile.nickname}
              size={92}
            />
            <AppText style={styles.name}>{profile.nickname}</AppText>
            <AppText style={styles.userType}>{profile.userType}</AppText>
            <View style={styles.tags}>
              {profile.tags.map((tag) => (
                <View key={tag} style={styles.tag}>
                  <AppText style={styles.tagText}>#{tag}</AppText>
                </View>
              ))}
            </View>
            <AppText style={styles.bio}>{profile.bio || '一言プロフィールはまだありません。'}</AppText>
          </View>

          {request ? (
            <View style={styles.morningCard}>
              <AppText style={styles.cardTitle}>明日の朝</AppText>
              <View style={styles.timeRow}>
                <Ionicons color={paperColors.ink} name="alarm-outline" size={21} />
                <AppText style={styles.time}>{request.wakeAt}</AppText>
              </View>
              <AppText style={styles.detail}>予定　{request.schedules.join(' ・ ')}</AppText>
              <AppText style={styles.detail}>気分　{request.mood}</AppText>
            </View>
          ) : null}

          {error ? <AppText style={styles.error}>{error}</AppText> : null}
        </>
      ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: paperColors.base },
  content: {
    width: '100%',
    maxWidth: 560,
    alignSelf: 'center',
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xxxl,
    gap: spacing.xl,
  },
  profileCard: {
    position: 'relative',
    alignItems: 'center',
    padding: spacing.xl,
    borderWidth: 2,
    borderColor: paperColors.ink,
    borderRadius: 14,
    backgroundColor: paperColors.base,
    ...shadows.paper,
  },
  tape: {
    position: 'absolute',
    zIndex: 1,
    top: -11,
    right: 32,
    width: 78,
    height: 21,
    backgroundColor: paperColors.tape,
    transform: [{ rotate: '2deg' }],
  },
  headingUnderline: {
    width: 150,
    height: 5,
    marginTop: -spacing.lg,
    borderRadius: 3,
    backgroundColor: paperColors.ruleBlue,
  },
  name: { marginTop: spacing.md, color: paperColors.ink, fontSize: 28, lineHeight: 35 },
  userType: {
    marginTop: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    color: paperColors.ink,
    fontSize: 13,
    lineHeight: 18,
    backgroundColor: paperColors.salmon,
  },
  tags: { marginTop: spacing.md, flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  tag: { paddingHorizontal: spacing.sm, paddingVertical: spacing.xs, backgroundColor: paperColors.noteBlue },
  tagText: { color: paperColors.ink, fontSize: 12, lineHeight: 17 },
  bio: { marginTop: spacing.lg, color: paperColors.ink, fontSize: 14, lineHeight: 22, textAlign: 'center' },
  morningCard: {
    padding: spacing.lg,
    borderWidth: 2,
    borderColor: paperColors.ink,
    borderRadius: 12,
    backgroundColor: paperColors.base,
    gap: spacing.sm,
    ...shadows.paper,
  },
  cardTitle: { color: paperColors.ink, fontSize: 16, lineHeight: 22 },
  timeRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  time: { color: paperColors.ink, fontSize: 34, lineHeight: 42, letterSpacing: 1 },
  detail: { color: paperColors.ink, fontSize: 14, lineHeight: 21 },
  error: { color: paperColors.ink, fontSize: 13, lineHeight: 20, textAlign: 'center' },
});
