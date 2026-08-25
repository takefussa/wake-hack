import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/common/app-text';
import { Avatar } from '@/components/common/avatar';
import { colors, spacing } from '@/constants/theme';
import type { ThanksInboxItem } from '@/types';

type ThanksInboxRowProps = {
  item: ThanksInboxItem;
};

function formatTime(createdAt: string): string {
  const date = new Date(createdAt);
  if (Number.isNaN(date.getTime())) return '';
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}

export function ThanksInboxRow({ item }: ThanksInboxRowProps) {
  const senderName = item.sender?.nickname ?? '誰か';

  return (
    <View style={styles.container}>
      <Avatar
        avatarId={item.sender?.avatarId ?? 'luna'}
        imageUri={item.sender?.profileImageUri}
        name={senderName}
        size={44}
      />
      <View style={styles.copy}>
        <View style={styles.header}>
          <AppText variant="bodyMedium">{senderName}</AppText>
          <AppText variant="caption" tone="muted">
            {formatTime(item.message.createdAt)}
          </AppText>
        </View>
        <AppText variant="secondary" tone="soft">
          {item.message.content ?? 'ありがとうが届きました。'}
        </AppText>
        <AppText variant="caption" tone="muted">
          {item.contextLabel}
        </AppText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.separator,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
  },
  copy: {
    flex: 1,
    gap: spacing.sm,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
});
