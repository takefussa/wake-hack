import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/common/app-text';
import { Avatar } from '@/components/common/avatar';
import { Screen } from '@/components/common/screen';
import { colors, spacing } from '@/constants/theme';
import { getMockUserById } from '@/data/mock-users';
import { useAppStore } from '@/store/use-app-store';

export default function FriendsScreen() {
  const friendships = useAppStore((state) => state.friendships);

  return (
    <Screen contentStyle={styles.content} testID="friends-screen">
      <View style={styles.header}>
        <AppText variant="screenTitle">フレンド</AppText>
        <AppText variant="secondary" tone="soft">
          また一緒に朝を迎えたいと思った人。
        </AppText>
      </View>

      <View style={styles.list}>
        {friendships.map((friendship) => {
          const friend = getMockUserById(friendship.userBId);
          if (!friend) return null;

          return (
            <View key={friendship.id} style={styles.friendRow}>
              <Avatar avatarId={friend.avatarId} name={friend.nickname} size={52} />
              <View style={styles.friendCopy}>
                <AppText variant="bodyMedium">{friend.nickname}</AppText>
                <AppText variant="secondary" tone="soft">
                  {friend.userType}
                </AppText>
              </View>
              <View style={styles.count}>
                <AppText variant="bodyMedium">{friendship.morningCount}回</AppText>
                <AppText variant="caption" tone="muted">
                  一緒に起きた
                </AppText>
              </View>
            </View>
          );
        })}
      </View>
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
    minHeight: 84,
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
  count: {
    alignItems: 'flex-end',
    gap: spacing.xs,
  },
});
