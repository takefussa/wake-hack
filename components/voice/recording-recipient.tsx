import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/common/app-text';
import { Avatar } from '@/components/common/avatar';
import { colors, paperColors, shadows, spacing } from '@/constants/theme';
import type { MorningRequest, UserProfile } from '@/types';

type RecordingRecipientProps = {
  request: MorningRequest;
  user: UserProfile;
};

export function RecordingRecipient({ request, user }: RecordingRecipientProps) {
  return (
    <View style={styles.container}>
      <View pointerEvents="none" style={styles.tape} />
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
    position: 'relative',
    padding: spacing.lg,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: paperColors.ink,
    backgroundColor: paperColors.base,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    ...shadows.paper,
  },
  tape: {
    position: 'absolute',
    top: -11,
    right: 34,
    width: 78,
    height: 22,
    zIndex: 2,
    backgroundColor: paperColors.tape,
    transform: [{ rotate: '-1deg' }],
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
