import Ionicons from '@expo/vector-icons/Ionicons';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { AppButton } from '@/components/common/app-button';
import { AppText } from '@/components/common/app-text';
import { colors, radii, spacing } from '@/constants/theme';
import type { MicrophonePermissionState } from '@/hooks/use-voice-recorder';

type MicrophonePermissionGateProps = {
  permissionState: MicrophonePermissionState;
  canAskPermissionAgain: boolean;
  isRequestingPermission: boolean;
  error: string | null;
  onRequestPermission: () => void;
  onOpenSettings: () => void;
};

export function MicrophonePermissionGate({
  permissionState,
  canAskPermissionAgain,
  isRequestingPermission,
  error,
  onRequestPermission,
  onOpenSettings,
}: MicrophonePermissionGateProps) {
  if (permissionState === 'checking') {
    return (
      <View style={styles.state}>
        <ActivityIndicator color={colors.indigo} />
        <AppText variant="secondary" tone="soft">
          マイクを確認しています
        </AppText>
      </View>
    );
  }

  return (
    <View style={styles.state}>
      <View style={styles.icon}>
        <Ionicons name="mic-outline" color={colors.indigo} size={28} />
      </View>
      <View style={styles.copy}>
        <AppText variant="sectionTitle">声を録音するには</AppText>
        <AppText variant="secondary" tone="soft" style={styles.centeredText}>
          マイクの使用を許可してください。録音した声は、この端末内に保存されます。
        </AppText>
      </View>
      <AppButton
        disabled={isRequestingPermission}
        label={canAskPermissionAgain ? 'マイクを許可する' : '設定を開く'}
        onPress={canAskPermissionAgain ? onRequestPermission : onOpenSettings}
      />
      {error ? (
        <AppText variant="caption" style={styles.error}>
          {error}
        </AppText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  state: {
    minHeight: 280,
    padding: spacing.xl,
    borderRadius: radii.card,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xl,
  },
  icon: {
    width: 64,
    height: 64,
    borderRadius: radii.avatar,
    backgroundColor: colors.indigoSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  copy: {
    alignItems: 'center',
    gap: spacing.sm,
  },
  centeredText: {
    maxWidth: 300,
    textAlign: 'center',
  },
  error: {
    color: colors.danger,
    textAlign: 'center',
  },
});
