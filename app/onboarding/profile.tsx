import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useMemo, useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';

import { AppButton } from '@/components/common/app-button';
import { AppText } from '@/components/common/app-text';
import { ChoiceChip } from '@/components/common/choice-chip';
import { IconButton } from '@/components/common/icon-button';
import { Screen } from '@/components/common/screen';
import { AvatarPicker } from '@/components/profile/avatar-picker';
import { prototypeConfig } from '@/constants/config';
import { profileTagOptions, userTypeOptions } from '@/constants/options';
import { colors, componentSizes, fonts, radii, spacing } from '@/constants/theme';
import { isProfileInputValid, toggleProfileTag } from '@/features/profile/profile-form';
import { profileService } from '@/services/profile-service';
import { useAppStore } from '@/store/use-app-store';
import type { AvatarId, CreateProfileInput, ProfileTag, UserType } from '@/types';

export default function ProfileSetupScreen() {
  const setProfile = useAppStore((state) => state.setProfile);
  const [avatarId, setAvatarId] = useState<AvatarId>('luna');
  const [nickname, setNickname] = useState('');
  const [userType, setUserType] = useState<UserType | null>(null);
  const [tags, setTags] = useState<ProfileTag[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit = useMemo(() => {
    if (!userType) return false;
    return isProfileInputValid({ avatarId, nickname, userType, tags });
  }, [avatarId, nickname, tags, userType]);

  async function handleSubmit() {
    if (!userType || !canSubmit || isSaving) return;

    const input: CreateProfileInput = { avatarId, nickname, userType, tags };
    setIsSaving(true);
    setError(null);

    try {
      const profile = await profileService.createProfile(input);
      setProfile(profile);
      router.replace('/(tabs)');
    } catch {
      setError('プロフィールを作成できませんでした。もう一度お試しください。');
      setIsSaving(false);
    }
  }

  return (
    <Screen contentStyle={styles.content} testID="profile-setup-screen">
      <StatusBar style="dark" />
      <View style={styles.navigation}>
        <IconButton icon="chevron-back" label="戻る" onPress={() => router.back()} />
      </View>

      <View style={styles.header}>
        <AppText variant="screenTitle">プロフィールを作る</AppText>
        <AppText variant="secondary" tone="soft">
          本名や顔写真は使いません。朝の相手には、この情報だけが見えます。
        </AppText>
      </View>

      <View style={styles.section}>
        <AppText variant="sectionTitle">アバター</AppText>
        <AvatarPicker value={avatarId} onChange={setAvatarId} />
      </View>

      <View style={styles.section}>
        <View style={styles.labelRow}>
          <AppText variant="sectionTitle">ニックネーム</AppText>
          <AppText variant="caption" tone="muted">
            {nickname.length}/{prototypeConfig.profileNicknameMaxLength}
          </AppText>
        </View>
        <TextInput
          accessibilityLabel="ニックネーム"
          autoCapitalize="none"
          autoCorrect={false}
          maxLength={prototypeConfig.profileNicknameMaxLength}
          onChangeText={setNickname}
          placeholder="例：Ryo"
          placeholderTextColor={colors.textTertiary}
          returnKeyType="done"
          selectionColor={colors.indigo}
          style={styles.input}
          value={nickname}
        />
      </View>

      <View style={styles.section}>
        <AppText variant="sectionTitle">あなたについて</AppText>
        <View style={styles.chips}>
          {userTypeOptions.map((option) => (
            <ChoiceChip
              key={option}
              label={option}
              onPress={() => setUserType(option)}
              selected={userType === option}
            />
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeading}>
          <AppText variant="sectionTitle">朝について</AppText>
          <AppText variant="caption" tone="muted">
            任意・複数選択
          </AppText>
        </View>
        <View style={styles.chips}>
          {profileTagOptions.map((tag) => (
            <ChoiceChip
              key={tag}
              label={tag}
              onPress={() => setTags((current) => toggleProfileTag(current, tag))}
              selected={tags.includes(tag)}
            />
          ))}
        </View>
      </View>

      {error ? (
        <AppText variant="secondary" style={styles.error}>
          {error}
        </AppText>
      ) : null}

      <AppButton
        disabled={!canSubmit || isSaving}
        label={isSaving ? '作成しています…' : 'プロフィールを作成'}
        onPress={() => void handleSubmit()}
        testID="profile-submit"
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: spacing.xxl,
  },
  navigation: {
    marginLeft: -spacing.md,
  },
  header: {
    gap: spacing.sm,
  },
  section: {
    gap: spacing.lg,
  },
  sectionHeading: {
    gap: spacing.xs,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  input: {
    minHeight: componentSizes.inputHeight,
    borderRadius: radii.input,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.lg,
    color: colors.text,
    fontFamily: fonts?.sans,
    fontSize: 16,
    letterSpacing: 0,
  },
  error: {
    color: colors.danger,
  },
});
