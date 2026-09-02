import Ionicons from '@expo/vector-icons/Ionicons';
import { Redirect, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppButton } from '@/components/common/app-button';
import { AppText } from '@/components/common/app-text';
import { Avatar } from '@/components/common/avatar';
import { LoadingState } from '@/components/common/loading-state';
import { Screen } from '@/components/common/screen';
import { ScreenHeader } from '@/components/common/screen-header';
import { colors, radii, spacing } from '@/constants/theme';
import { goBackOrReplace } from '@/features/navigation/go-back';
import { friendshipService } from '@/services/friendship-service';
import { profileService } from '@/services/profile-service';
import { useAppStore } from '@/store/use-app-store';
import type { Friendship, UserProfile } from '@/types';

export default function FriendProfileScreen() {
  const params = useLocalSearchParams<{ userId?: string | string[] }>();
  const userId = Array.isArray(params.userId) ? params.userId[0] : params.userId;
  const currentUser = useAppStore((state) => state.currentUser);
  const friendships = useAppStore((state) => state.friendships);
  const upsertFriendship = useAppStore((state) => state.upsertFriendship);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [friendship, setFriendship] = useState<Friendship | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadProfile = useCallback(async () => {
    if (!currentUser || !userId || userId === currentUser.id) {
      setError('プロフィールを表示できませんでした。');
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const relation = await friendshipService.getBetween(
        currentUser.id,
        userId,
        friendships
      );
      if (!relation || relation.status !== 'matched') {
        setError('このプロフィールはオキメイトだけが確認できます。');
        return;
      }

      const nextProfile = await profileService.getProfile(userId);
      if (!nextProfile) {
        setError('プロフィールを読み込めませんでした。');
        return;
      }

      upsertFriendship(relation);
      setFriendship(relation);
      setProfile(nextProfile);
    } catch {
      setError('プロフィールを読み込めませんでした。');
    } finally {
      setIsLoading(false);
    }
  }, [currentUser, friendships, upsertFriendship, userId]);

  useEffect(() => {
    void loadProfile();
  }, [loadProfile]);

  if (!currentUser) {
    return <Redirect href="/onboarding" />;
  }

  return (
    <Screen contentStyle={styles.content} testID="friend-profile-screen">
      <StatusBar style="dark" />
      <ScreenHeader
        onBack={() => goBackOrReplace('/(tabs)/friends')}
        title="プロフィール"
      />

      {isLoading ? <LoadingState label="プロフィールを読み込んでいます" /> : null}

      {!isLoading && error ? (
        <View style={styles.errorState}>
          <Ionicons color={colors.textTertiary} name="person-outline" size={32} />
          <AppText variant="bodyMedium" style={styles.centeredText}>
            {error}
          </AppText>
          <AppButton
            label="もう一度読み込む"
            onPress={() => void loadProfile()}
            variant="secondary"
          />
        </View>
      ) : null}

      {!isLoading && profile && friendship ? (
        <>
          <View style={styles.identity}>
            <Avatar
              avatarId={profile.avatarId}
              imageUri={profile.profileImageUri}
              name={profile.nickname}
              size={96}
            />
            <View style={styles.identityCopy}>
              <AppText variant="screenTitle" style={styles.centeredText}>
                {profile.nickname}
              </AppText>
              <AppText variant="secondary" tone="soft">
                {profile.userType}
              </AppText>
            </View>
          </View>

          {profile.bio ? (
            <View style={styles.bio}>
              <AppText variant="caption" tone="muted">
                一言
              </AppText>
              <AppText variant="body">{profile.bio}</AppText>
            </View>
          ) : null}

          <View style={styles.details}>
            <View style={styles.detailRow}>
              <AppText variant="secondary" tone="soft">
                朝のタイプ
              </AppText>
              <View style={styles.tags}>
                {profile.tags.length > 0 ? (
                  profile.tags.map((tag) => (
                    <View key={tag} style={styles.tag}>
                      <AppText variant="caption" tone="accent">
                        {tag}
                      </AppText>
                    </View>
                  ))
                ) : (
                  <AppText variant="secondary" tone="muted">
                    未設定
                  </AppText>
                )}
              </View>
            </View>
            <View style={styles.detailRow}>
              <AppText variant="secondary" tone="soft">
                一緒に迎えた朝
              </AppText>
              <AppText variant="bodyMedium">{friendship.morningCount}回</AppText>
            </View>
          </View>

          <View style={styles.relationshipNote}>
            <Ionicons color={colors.success} name="heart-outline" size={20} />
            <AppText variant="secondary" tone="soft" style={styles.noteCopy}>
              声を通じてつながったオキメイトです。
            </AppText>
          </View>
        </>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: spacing.xxl,
  },
  identity: {
    alignItems: 'center',
    gap: spacing.lg,
    paddingVertical: spacing.lg,
  },
  identityCopy: {
    alignItems: 'center',
    gap: spacing.xs,
  },
  centeredText: {
    textAlign: 'center',
  },
  bio: {
    paddingVertical: spacing.lg,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: colors.separator,
    gap: spacing.sm,
  },
  details: {
    borderTopWidth: 1,
    borderTopColor: colors.separator,
  },
  detailRow: {
    minHeight: 68,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.separator,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.lg,
  },
  tags: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-end',
    gap: spacing.sm,
  },
  tag: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radii.chip,
    backgroundColor: colors.indigoSoft,
  },
  relationshipNote: {
    padding: spacing.lg,
    borderRadius: radii.card,
    backgroundColor: colors.successSoft,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  noteCopy: {
    flex: 1,
  },
  errorState: {
    flex: 1,
    minHeight: 320,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.lg,
  },
});
