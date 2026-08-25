import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { Alert, Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/common/app-text';
import { Avatar } from '@/components/common/avatar';
import { IconButton } from '@/components/common/icon-button';
import { Screen } from '@/components/common/screen';
import { StatTile } from '@/components/common/stat-tile';
import { Tag } from '@/components/common/tag';
import { colors, componentSizes, spacing } from '@/constants/theme';
import { useAppStore } from '@/store/use-app-store';

export default function ProfileScreen() {
  const currentUser = useAppStore((state) => state.currentUser);
  const friendships = useAppStore((state) => state.friendships);
  const resetPrototype = useAppStore((state) => state.resetPrototype);

  if (!currentUser) return null;

  const matchedFriendCount = friendships.filter(
    (friendship) => friendship.status === 'matched'
  ).length;

  function handleReset() {
    Alert.alert('プロトタイプをリセット', 'プロフィールと朝の状態を消して、最初から確認します。', [
      { text: 'キャンセル', style: 'cancel' },
      {
        text: 'リセット',
        style: 'destructive',
        onPress: () => {
          resetPrototype();
          router.replace('/onboarding');
        },
      },
    ]);
  }

  return (
    <Screen contentStyle={styles.content} testID="profile-screen">
      <View style={styles.header}>
        <AppText variant="screenTitle">プロフィール</AppText>
        <IconButton
          icon="create-outline"
          label="プロフィールを編集"
          onPress={() => router.push('/profile-edit')}
        />
      </View>

      <View style={styles.identity}>
        <Avatar
          avatarId={currentUser.avatarId}
          imageUri={currentUser.profileImageUri}
          name={currentUser.nickname}
          size={componentSizes.avatarLarge}
        />
        <View style={styles.identityCopy}>
          <AppText variant="sectionTitle">{currentUser.nickname}</AppText>
          <AppText variant="secondary" tone="soft">
            {currentUser.userType}
          </AppText>
        </View>
      </View>

      {currentUser.bio ? (
        <AppText variant="body" style={styles.bio}>
          {currentUser.bio}
        </AppText>
      ) : null}

      {currentUser.tags.length > 0 ? (
        <View style={styles.tags}>
          {currentUser.tags.map((tag) => (
            <Tag key={tag} label={tag} />
          ))}
        </View>
      ) : null}

      <View style={styles.section}>
        <AppText variant="sectionTitle">朝の記録</AppText>
        <View style={styles.stats}>
          <StatTile value="12人" label="声を届けた" />
          <StatTile value="10回" label="起こしてもらった" />
          <StatTile value={`${matchedFriendCount}人`} label="フレンド" />
          <StatTile value="5日" label="連続起床" />
        </View>
      </View>

      <View style={styles.privacy}>
        <Ionicons name="shield-checkmark-outline" size={22} color={colors.indigo} />
        <View style={styles.privacyCopy}>
          <AppText variant="bodyMedium">匿名でつながっています</AppText>
          <AppText variant="secondary" tone="soft">
            本名、学校名、会社名、詳しい住所は共有されません。
          </AppText>
        </View>
      </View>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="プロトタイプをリセット"
        onPress={handleReset}
        style={({ pressed }) => [styles.reset, pressed && styles.resetPressed]}>
        <AppText variant="secondary" style={styles.resetText}>
          プロトタイプをリセット
        </AppText>
      </Pressable>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: spacing.xxl,
  },
  header: {
    minHeight: componentSizes.touchTarget,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.lg,
  },
  identity: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
  },
  identityCopy: {
    gap: spacing.xs,
  },
  bio: {
    maxWidth: 360,
  },
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  section: {
    gap: spacing.md,
  },
  stats: {
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: colors.separator,
    flexDirection: 'row',
    flexWrap: 'wrap',
    columnGap: spacing.xl,
    paddingVertical: spacing.sm,
  },
  privacy: {
    paddingVertical: spacing.lg,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: colors.separator,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
  },
  privacyCopy: {
    flex: 1,
    gap: spacing.xs,
  },
  reset: {
    minHeight: componentSizes.touchTarget,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resetPressed: {
    opacity: 0.6,
  },
  resetText: {
    color: colors.danger,
  },
});
