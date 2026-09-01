import Ionicons from '@expo/vector-icons/Ionicons';
import { Redirect, router } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/common/app-text';
import { Avatar } from '@/components/common/avatar';
import { LoadingState } from '@/components/common/loading-state';
import { Screen } from '@/components/common/screen';
import { getMockWakeTime } from '@/data/mock-wake-times';
import { paperColors, shadows, spacing } from '@/constants/theme';
import { morningRequestService } from '@/services/morning-request-service';
import { profileService } from '@/services/profile-service';
import { useAppStore } from '@/store/use-app-store';
import type { Friendship, MorningRequest, UserProfile } from '@/types';

type FriendListItem = {
  friendship: Friendship;
  profile: UserProfile;
  request: MorningRequest | null;
  wokeAt: string | null;
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
        const requests = await morningRequestService.getAvailableRequests(userId);
        const items = await Promise.all(
          matchedFriendships.map(async (friendship) => {
            const friendUserId = getFriendUserId(friendship, userId);
            const profile = await profileService.getProfile(friendUserId);
            return profile
              ? {
                  friendship,
                  profile,
                  request: requests.find((request) => request.userId === friendUserId) ?? null,
                  wokeAt: getMockWakeTime(friendUserId),
                }
              : null;
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
        <View style={styles.titleUnderline} />
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
          {friends.map(({ friendship, profile, request, wokeAt }) => (
            <Pressable
              accessibilityLabel={`${profile.nickname}さんのプロフィールを見る`}
              accessibilityRole="button"
              key={friendship.id}
              onPress={() =>
                router.push({ pathname: '/user/[id]', params: { id: profile.id } })
              }
              style={({ pressed }) => [styles.friendCard, pressed && styles.friendCardPressed]}>
              <View pointerEvents="none" style={styles.friendTape} />
              <View style={styles.identityRow}>
                <Avatar
                  avatarId={profile.avatarId}
                  imageUri={profile.profileImageUri}
                  name={profile.nickname}
                  size={56}
                />
                <View style={styles.friendCopy}>
                  <AppText style={styles.friendName}>{profile.nickname}</AppText>
                  <AppText style={styles.friendMeta}>
                    {profile.userType} ・ 一緒に迎えた朝 {friendship.morningCount}回
                  </AppText>
                </View>
                <Ionicons color={paperColors.ink} name="chevron-forward" size={20} />
              </View>

              <View style={styles.timeGrid}>
                <View style={styles.timeTile}>
                  <AppText style={styles.dataLabel}>今日の起床時刻</AppText>
                  <AppText style={styles.dataTime}>{wokeAt ?? '記録なし'}</AppText>
                </View>
                <View style={[styles.timeTile, styles.plannedTile]}>
                  <AppText style={styles.dataLabel}>予定起床時刻</AppText>
                  <AppText style={styles.dataTime}>{request?.wakeAt ?? '未設定'}</AppText>
                </View>
              </View>

              <View style={styles.morningDetails}>
                <View style={styles.detailRow}>
                  <Ionicons color={paperColors.ink} name="happy-outline" size={17} />
                  <AppText style={styles.detailLabel}>気分</AppText>
                  <AppText numberOfLines={1} style={styles.detailValue}>
                    {request?.mood ?? '未設定'}
                  </AppText>
                </View>
                <View style={styles.detailRow}>
                  <Ionicons color={paperColors.ink} name="calendar-outline" size={17} />
                  <AppText style={styles.detailLabel}>予定</AppText>
                  <AppText numberOfLines={1} style={styles.detailValue}>
                    {request?.schedules.join(' ・ ') ?? '未設定'}
                  </AppText>
                </View>
              </View>
            </Pressable>
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
  titleUnderline: {
    width: 126,
    height: 5,
    marginTop: -spacing.sm,
    borderRadius: 3,
    backgroundColor: paperColors.ruleBlue,
  },
  list: {
    gap: spacing.xl,
  },
  friendCard: {
    position: 'relative',
    overflow: 'visible',
    padding: spacing.lg,
    borderWidth: 2,
    borderColor: paperColors.ink,
    borderRadius: 12,
    backgroundColor: paperColors.base,
    gap: spacing.lg,
    ...shadows.paper,
  },
  friendTape: {
    position: 'absolute',
    zIndex: 2,
    top: -11,
    left: '39%',
    width: 82,
    height: 21,
    backgroundColor: paperColors.tape,
    transform: [{ rotate: '-2deg' }],
  },
  friendCardPressed: {
    opacity: 0.65,
    transform: [{ translateY: 1 }],
  },
  identityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  friendCopy: {
    flex: 1,
    gap: 2,
  },
  friendName: {
    color: paperColors.ink,
    fontSize: 20,
    lineHeight: 26,
  },
  friendMeta: {
    color: paperColors.ink,
    fontSize: 11,
    lineHeight: 16,
  },
  timeGrid: {
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: paperColors.ink,
    borderRadius: 8,
    overflow: 'hidden',
  },
  timeTile: {
    flex: 1,
    minHeight: 76,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.sm,
    backgroundColor: paperColors.clockGray,
  },
  plannedTile: {
    borderLeftWidth: 1,
    borderLeftColor: paperColors.ink,
    backgroundColor: paperColors.noteBlue,
  },
  dataLabel: {
    color: paperColors.ink,
    fontSize: 11,
    lineHeight: 16,
  },
  dataTime: {
    marginTop: 3,
    color: paperColors.ink,
    fontSize: 23,
    lineHeight: 29,
  },
  morningDetails: {
    gap: spacing.sm,
  },
  detailRow: {
    minHeight: 30,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  detailLabel: {
    width: 38,
    color: paperColors.ink,
    fontSize: 12,
    lineHeight: 17,
  },
  detailValue: {
    flex: 1,
    color: paperColors.ink,
    fontSize: 14,
    lineHeight: 20,
  },
  emptyState: {
    paddingVertical: spacing.xxl,
    paddingHorizontal: spacing.lg,
    borderWidth: 2,
    borderColor: paperColors.ink,
    borderRadius: 12,
    backgroundColor: paperColors.base,
    gap: spacing.sm,
    ...shadows.paper,
  },
});
