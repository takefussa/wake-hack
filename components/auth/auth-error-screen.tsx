import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View } from 'react-native';

import { AppButton } from '@/components/common/app-button';
import { AppLogo } from '@/components/common/app-logo';
import { AppText } from '@/components/common/app-text';
import { colors, layout, spacing } from '@/constants/theme';
import type { AuthBootstrapFailure } from '@/hooks/use-auth-bootstrap';

type AuthErrorScreenProps = {
  failure: AuthBootstrapFailure | null;
  onRetry: () => void;
};

const errorCopy: Record<
  AuthBootstrapFailure,
  { title: string; description: string }
> = {
  anonymous_disabled: {
    title: 'Supabaseの設定が必要です',
    description:
      '管理画面で匿名ログインを有効にしてから、もう一度お試しください。',
  },
  database_not_ready: {
    title: 'データベースの準備が必要です',
    description:
      '付属のmigration SQLをSupabaseで実行してから、もう一度お試しください。',
  },
  configuration: {
    title: '接続設定が見つかりません',
    description: 'Supabaseの公開URLと公開キーを確認してください。',
  },
  network: {
    title: '接続を確認できませんでした',
    description: '通信環境を確認して、もう一度お試しください。',
  },
  unknown: {
    title: 'アプリを準備できませんでした',
    description: '設定を確認して、もう一度お試しください。',
  },
};

export function AuthErrorScreen({ failure, onRetry }: AuthErrorScreenProps) {
  const copy = errorCopy[failure ?? 'unknown'];

  return (
    <View style={styles.root}>
      <StatusBar style="light" />
      <View style={styles.content}>
        <AppLogo mode="dark" />
        <View style={styles.copy}>
          <AppText variant="sectionTitle" tone="light" style={styles.centeredText}>
            {copy.title}
          </AppText>
          <AppText variant="secondary" tone="lightMuted" style={styles.centeredText}>
            {copy.description}
          </AppText>
        </View>
        <AppButton label="もう一度試す" onPress={onRetry} variant="inverted" />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.navy,
    paddingHorizontal: layout.screenPadding,
  },
  content: {
    width: '100%',
    maxWidth: 360,
    gap: spacing.xxl,
  },
  copy: {
    gap: spacing.sm,
  },
  centeredText: {
    textAlign: 'center',
  },
});
