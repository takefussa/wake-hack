import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/common/app-text';
import { Avatar } from '@/components/common/avatar';
import { Screen } from '@/components/common/screen';
import { StatTile } from '@/components/common/stat-tile';
import { prototypeConfig } from '@/constants/config';
import { colors, fonts, spacing } from '@/constants/theme';
import { getMockUserById } from '@/data/mock-users';
import { useAppStore } from '@/store/use-app-store';

export default function ConnectionsScreen() {
  const thanksMessages = useAppStore((state) => state.thanksMessages);

  return (
    <Screen contentStyle={styles.content} testID="connections-screen">
      <View style={styles.header}>
        <AppText variant="screenTitle">つながり</AppText>
        <AppText variant="secondary" tone="soft">
          同じ時間に始まった朝と、届いた言葉。
        </AppText>
      </View>

      <View style={styles.morningSummary}>
        <AppText variant="secondary" tone="soft">
          今日、Wake Hackで朝を始めた人
        </AppText>
        <View style={styles.totalRow}>
          <AppText variant="displayNumber" style={styles.totalNumber}>
            {prototypeConfig.totalMorningCount.toLocaleString()}
          </AppText>
          <AppText variant="secondary" tone="soft">
            人
          </AppText>
        </View>
      </View>

      <View style={styles.stats}>
        <StatTile compact value={`${prototypeConfig.nearbyWakeCount}人`} label="7時前後" />
        <View style={styles.verticalDivider} />
        <StatTile compact value="48人" label="大学生" />
        <View style={styles.verticalDivider} />
        <StatTile compact value="17人" label="1限あり" />
      </View>

      <View style={styles.section}>
        <AppText variant="sectionTitle">届いたありがとう</AppText>
        <View style={styles.thanksList}>
          {thanksMessages.slice(0, 2).map((message) => {
            const sender = getMockUserById(message.senderId);
            if (!sender) return null;

            return (
              <View key={message.id} style={styles.thanksRow}>
                <Avatar
                  avatarId={sender.avatarId}
                  imageUri={sender.profileImageUri}
                  name={sender.nickname}
                  size={44}
                />
                <View style={styles.thanksCopy}>
                  <View style={styles.thanksHeader}>
                    <AppText variant="bodyMedium">{sender.nickname}</AppText>
                    <AppText variant="caption" tone="muted">
                      7:42
                    </AppText>
                  </View>
                  <AppText variant="secondary" tone="soft">
                    {message.content}
                  </AppText>
                </View>
              </View>
            );
          })}
        </View>
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
  morningSummary: {
    paddingVertical: spacing.lg,
    gap: spacing.sm,
  },
  totalRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: spacing.sm,
  },
  totalNumber: {
    color: colors.indigo,
    fontFamily: fonts?.rounded,
  },
  stats: {
    paddingVertical: spacing.sm,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: colors.separator,
    flexDirection: 'row',
    alignItems: 'stretch',
  },
  verticalDivider: {
    width: 1,
    marginVertical: spacing.md,
    backgroundColor: colors.separator,
  },
  section: {
    gap: spacing.md,
  },
  thanksList: {
    borderTopWidth: 1,
    borderTopColor: colors.separator,
  },
  thanksRow: {
    paddingVertical: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.separator,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
  },
  thanksCopy: {
    flex: 1,
    gap: spacing.sm,
  },
  thanksHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: spacing.sm,
  },
});
