import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/common/app-text';
import { Avatar } from '@/components/common/avatar';
import { colors, radii, spacing } from '@/constants/theme';
import type { MorningRequest, UserProfile } from '@/types';

type RecordingRecipientProps = {
  request: MorningRequest;
  user: UserProfile;
};

export function RecordingRecipient({ request, user }: RecordingRecipientProps) {
  return (
    <View style={styles.container}>
      <Avatar
        avatarId={user.avatarId}
        imageUri={user.profileImageUri}
        name={user.nickname}
        size={52}
      />
      <View style={styles.copy}>
        <View style={styles.nameRow}>
          <AppText variant="bodyMedium">{user.nickname}さんへ</AppText>
          <AppText variant="caption" tone="muted">
            {user.userType}
          </AppText>
        </View>
        <AppText variant="secondary" tone="soft">
          {request.schedules.join('・')} ・ {request.mood}
        </AppText>
        <View style={styles.voiceStyle}>
          <Ionicons name="volume-medium-outline" color={colors.indigo} size={16} />
          <AppText variant="caption" tone="accent">
            希望する声：{request.preferredVoiceStyle}
          </AppText>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: spacing.lg,
    borderRadius: radii.card,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  copy: {
    flex: 1,
    gap: spacing.xs,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  voiceStyle: {
    marginTop: spacing.xs,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
});
