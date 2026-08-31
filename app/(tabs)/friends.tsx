import { Redirect } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/common/app-text';
import { Avatar } from '@/components/common/avatar';
import { LoadingState } from '@/components/common/loading-state';
import { Screen } from '@/components/common/screen';
import { colors, spacing } from '@/constants/theme';
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
  const currentUserId = currentUser?.id;
  const matchedFriendships = useMemo(
    () => friendships.filter((friendship) => friendship.status === 'matched'),
    [friendships]
  );
  const [friends, setFriends] = useState<FriendListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!currentUserId) return;
    const userId = currentUserId;

    let isMounted = true;
    async function loadFriends() {
      try {
        const items = await Promise.all(
          matchedFriendships.map(async (friendship) => {
            const profile = await profileService.getProfile(
              getFriendUserId(friendship, userId)
            );
            return profile ? { friendship, profile } : null;
          })
        );
        if (isMounted) {
          setFriends(items.filter((item): item is FriendListItem => item !== null));
        }
      } catch {
        if (isMounted) setFriends([]);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    void loadFriends();
    return () => {
      isMounted = false;
    };
  }, [currentUserId, matchedFriendships]);

  if (!currentUser) {
    return <Redirect href="/onboarding" />;
  }

  return (
    <Screen contentStyle={styles.content} testID="friends-screen">
      <View style={styles.header}>
        <AppText variant="screenTitle">オキメイト</AppText>
        <AppText variant="secondary" tone="soft">
          一度声を通して、また一緒に朝を迎えたいと思った人。
        </AppText>
      </View>

      {isLoading ? <LoadingState label="朝のつながりを読み込んでいます" /> : null}
      {!isLoading && friends.length === 0 ? (
        <View style={styles.emptyState}>
          <AppText variant="bodyMedium">まだオキメイトはいません</AppText>
          <AppText variant="secondary" tone="soft">
            良い声の体験があったときだけ、無理なくつながれます。
          </AppText>
        </View>
      ) : null}
      {!isLoading && friends.length > 0 ? (
        <View style={styles.list}>
          {friends.map(({ friendship, profile }) => (
            <View key={friendship.id} style={styles.friendRow}>
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
            </View>
          ))}
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
    gap: spacing.sm,
  },
  list: {
    borderTopWidth: 1,
    borderTopColor: colors.separator,
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
});
