import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/common/app-text';
import { Avatar } from '@/components/common/avatar';
import { Tag } from '@/components/common/tag';
import { colors, fonts, radii, shadows, spacing } from '@/constants/theme';
import type { MorningRequest, UserProfile } from '@/types';

type MorningRequestCardProps = {
  request: MorningRequest;
  user: UserProfile;
  commonPoints: string[];
  onPress: () => void;
};

export function MorningRequestCard({
  request,
  user,
  commonPoints,
  onPress,
}: MorningRequestCardProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${user.nickname}さんの朝リクエストを見る`}
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}>
      <View style={styles.header}>
        <View style={styles.person}>
          <Avatar
            avatarId={user.avatarId}
            imageUri={user.profileImageUri}
            name={user.nickname}
            size={48}
          />
          <View style={styles.nameGroup}>
            <AppText variant="bodyMedium">{user.nickname}</AppText>
            <AppText variant="caption" tone="muted">
              {user.userType}
            </AppText>
          </View>
        </View>
        <Ionicons name="chevron-forward" color={colors.textTertiary} size={19} />
      </View>

      <View style={styles.morning}>
        <View style={styles.timeGroup}>
          <AppText variant="caption" tone="muted">
            起床時刻
          </AppText>
          <AppText variant="displayNumber" style={styles.time}>
            {request.wakeAt}
          </AppText>
        </View>
        <View style={styles.details}>
          <View style={styles.detailRow}>
            <AppText variant="caption" tone="muted" style={styles.detailLabel}>
              予定
            </AppText>
            <AppText variant="secondary">{request.schedules.join('・')}</AppText>
          </View>
          <View style={styles.detailRow}>
            <AppText variant="caption" tone="muted" style={styles.detailLabel}>
              希望
            </AppText>
            <AppText variant="secondary">{request.preferredVoiceStyle}</AppText>
          </View>
        </View>
      </View>

      {commonPoints.length > 0 ? (
        <View style={styles.common}>
          <AppText variant="caption" tone="muted">
            あなたとの共通点
          </AppText>
          <View style={styles.tags}>
            {commonPoints.map((point) => (
              <Tag key={point} label={point} />
            ))}
          </View>
        </View>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: spacing.lg,
    borderRadius: radii.card,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    gap: spacing.lg,
    ...shadows.surface,
  },
  pressed: {
    opacity: 0.78,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  person: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  nameGroup: {
    flex: 1,
    gap: spacing.xs,
  },
  morning: {
    paddingTop: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.separator,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xl,
  },
  timeGroup: {
    gap: spacing.xs,
  },
  time: {
    fontFamily: fonts?.rounded,
    fontSize: 30,
    lineHeight: 36,
  },
  details: {
    flex: 1,
    gap: spacing.sm,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: spacing.sm,
  },
  detailLabel: {
    width: 32,
  },
  common: {
    gap: spacing.sm,
  },
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
});
