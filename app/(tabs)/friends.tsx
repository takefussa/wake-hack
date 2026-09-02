import Ionicons from '@expo/vector-icons/Ionicons';
import { useFocusEffect } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';
import { Redirect, router } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';

import { AppButton } from '@/components/common/app-button';
import { AppText } from '@/components/common/app-text';
import { Avatar } from '@/components/common/avatar';
import { LoadingState } from '@/components/common/loading-state';
import { Screen } from '@/components/common/screen';
import { colors, spacing } from '@/constants/theme';
import { friendshipService } from '@/services/friendship-service';
import { profileService } from '@/services/profile-service';
import { useAppStore } from '@/store/use-app-store';
import type { Friendship, UserProfile } from '@/types';

type FriendListItem = {
  friendship: Friendship;
  profile: UserProfile;
};

function getFriendUserId(friendship: Friendship, currentUserId: string): string {
  if (friendship.userAId === currentUserId || friendship.userAId === 'current-user') {
    return friendship.userBId;
  }
  return friendship.userAId;
}

export default function FriendsScreen() {
  const currentUser = useAppStore((state) => state.currentUser);
  const friendships = useAppStore((state) => state.friendships);
  const upsertFriendship = useAppStore((state) => state.upsertFriendship);
  const currentUserId = currentUser?.id;
  const [friends, setFriends] = useState<FriendListItem[]>([]);
  const [incomingRequests, setIncomingRequests] = useState<FriendListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [respondingId, setRespondingId] = useState<string | null>(null);

  const loadFriends = useCallback(async (showLoading: boolean) => {
    if (!currentUserId) {
      setIsLoading(false);
      return;
    }
    const userId = currentUserId;
    if (showLoading) setIsLoading(true);

    try {
      const availableFriendships = await friendshipService.getForUser(
        userId,
        friendships
      );
      const visibleFriendships = availableFriendships.filter(
        (friendship) =>
          friendship.status === 'matched' ||
          !friendshipService.hasRequested(friendship, userId)
      );
      const items = await Promise.all(
        visibleFriendships.map(async (friendship) => {
          const profile = await profileService.getProfile(
            getFriendUserId(friendship, userId)
          );
          return profile ? { friendship, profile } : null;
        })
      );
      const availableItems = items.filter(
        (item): item is FriendListItem => item !== null
      );
      availableFriendships.forEach(upsertFriendship);
      setFriends(
        availableItems.filter((item) => item.friendship.status === 'matched')
      );
      setIncomingRequests(
        availableItems.filter((item) => item.friendship.status === 'pending')
      );
      setLoadError(null);
    } catch {
      const localVisible = friendships.filter(
        (friendship) =>
          friendship.status === 'matched' ||
          !friendshipService.hasRequested(friendship, userId)
      );
      const localItems = await Promise.all(
        localVisible.map(async (friendship) => {
          const profile = await profileService.getProfile(
            getFriendUserId(friendship, userId)
          );
          return profile ? { friendship, profile } : null;
        })
      );
      const availableItems = localItems.filter(
        (item): item is FriendListItem => item !== null
      );
      setFriends(
        availableItems.filter((item) => item.friendship.status === 'matched')
      );
      setIncomingRequests(
        availableItems.filter((item) => item.friendship.status === 'pending')
      );
      setLoadError('オキメイトを更新できませんでした。');
    } finally {
      if (showLoading) setIsLoading(false);
    }
  }, [currentUserId, friendships, upsertFriendship]);

  useFocusEffect(useCallback(() => {
    void loadFriends(true);
  }, [loadFriends]));

  async function handleRefresh() {
    if (isRefreshing) return;
    setIsRefreshing(true);
    try {
      await loadFriends(false);
    } finally {
      setIsRefreshing(false);
    }
  }

  async function handleRespond(friendship: Friendship) {
    if (!currentUserId || respondingId) return;

    setRespondingId(friendship.id);
    setLoadError(null);
    try {
      const matched = await friendshipService.respond(currentUserId, friendship);
      upsertFriendship(matched);
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(
        () => undefined
      );
      await loadFriends(false);
    } catch {
      setLoadError('希望を届けられませんでした。もう一度お試しください。');
    } finally {
      setRespondingId(null);
    }
  }

  if (!currentUser) {
    return <Redirect href="/onboarding" />;
  }

  return (
    <Screen contentStyle={styles.content} testID="friends-screen">
      <View style={styles.header}>
        <View style={styles.headerCopy}>
          <AppText variant="screenTitle">オキメイト</AppText>
          <AppText variant="secondary" tone="soft">
            一度声を通して、また一緒に朝を迎えたいと思った人。
          </AppText>
        </View>
        <Pressable
          accessibilityLabel="オキメイトを更新"
          accessibilityRole="button"
          disabled={isRefreshing}
          hitSlop={8}
          onPress={() => void handleRefresh()}
          style={({ pressed }) => [
            styles.refreshButton,
            pressed && styles.refreshButtonPressed,
          ]}
        >
          {isRefreshing ? (
            <ActivityIndicator color={colors.indigo} size="small" />
          ) : (
            <Ionicons color={colors.indigo} name="refresh" size={21} />
          )}
        </Pressable>
      </View>

      {loadError ? (
        <AppText variant="caption" style={styles.error}>
          {loadError}
        </AppText>
      ) : null}

      {isLoading ? <LoadingState label="朝のつながりを読み込んでいます" /> : null}
      {!isLoading && incomingRequests.length > 0 ? (
        <View style={styles.section}>
          <AppText variant="sectionTitle">届いている希望</AppText>
          <View style={styles.list}>
            {incomingRequests.map(({ friendship, profile }) => (
              <View key={friendship.id} style={styles.incomingRow}>
                <View style={styles.personRow}>
                  <Avatar
                    avatarId={profile.avatarId}
                    imageUri={profile.profileImageUri}
                    name={profile.nickname}
                    size={52}
                  />
                  <View style={styles.friendCopy}>
                    <AppText variant="bodyMedium">{profile.nickname}</AppText>
                    <AppText variant="secondary" tone="soft">
                      また一緒に朝を迎えたいと思っています。
                    </AppText>
                  </View>
                </View>
                <AppButton
                  compact
                  disabled={respondingId !== null}
                  icon="heart-outline"
                  label={
                    respondingId === friendship.id
                      ? '届けています…'
                      : '私もまた朝を迎えたい'
                  }
                  onPress={() => void handleRespond(friendship)}
                  variant="secondary"
                />
              </View>
            ))}
          </View>
        </View>
      ) : null}
      {!isLoading && friends.length === 0 && incomingRequests.length === 0 ? (
        <View style={styles.emptyState}>
          <AppText variant="bodyMedium">まだオキメイトはいません</AppText>
          <AppText variant="secondary" tone="soft">
            良い声の体験があったときだけ、無理なくつながれます。
          </AppText>
        </View>
      ) : null}
      {!isLoading && friends.length > 0 ? (
        <View style={styles.section}>
          <AppText variant="sectionTitle">つながった人</AppText>
          <View style={styles.list}>
            {friends.map(({ friendship, profile }) => (
              <Pressable
                accessibilityHint="プロフィールを表示します"
                accessibilityLabel={`${profile.nickname}さんのプロフィール`}
                accessibilityRole="button"
                key={friendship.id}
                onPress={() =>
                  router.push({
                    pathname: '/friend/[userId]',
                    params: { userId: profile.id },
                  })
                }
                style={({ pressed }) => [
                  styles.friendRow,
                  pressed && styles.friendRowPressed,
                ]}
              >
                <Avatar
                  avatarId={profile.avatarId}
                  imageUri={profile.profileImageUri}
                  name={profile.nickname}
                  size={52}
                />
                <View style={styles.friendCopy}>
                  <AppText variant="bodyMedium">{profile.nickname}</AppText>
                  <AppText variant="secondary" tone="soft">
                    {profile.userType}
                  </AppText>
                  <AppText variant="caption" tone="muted">
                    一緒に迎えた朝 {friendship.morningCount}回
                  </AppText>
                </View>
                <Ionicons
                  color={colors.textTertiary}
                  name="chevron-forward"
                  size={20}
                />
              </Pressable>
            ))}
          </View>
        </View>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: spacing.xxl,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  headerCopy: {
    flex: 1,
    gap: spacing.sm,
  },
  refreshButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    borderRadius: 10,
  },
  refreshButtonPressed: {
    opacity: 0.65,
  },
  list: {
    borderTopWidth: 1,
    borderTopColor: colors.separator,
  },
  section: {
    gap: spacing.md,
  },
  incomingRow: {
    paddingVertical: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.separator,
    gap: spacing.md,
  },
  personRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  friendRow: {
    minHeight: 92,
    paddingVertical: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.separator,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  friendRowPressed: {
    opacity: 0.62,
  },
  friendCopy: {
    flex: 1,
    gap: spacing.xs,
  },
  emptyState: {
    paddingVertical: spacing.xxl,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: colors.separator,
    gap: spacing.sm,
  },
  error: {
    color: colors.danger,
  },
});
