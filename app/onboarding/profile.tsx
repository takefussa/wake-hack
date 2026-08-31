import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useMemo, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppButton } from '@/components/common/app-button';
import { AppText } from '@/components/common/app-text';
import { IconButton } from '@/components/common/icon-button';
import { Screen } from '@/components/common/screen';
import { ProfileFields } from '@/components/profile/profile-fields';
import { colors, spacing } from '@/constants/theme';
import { demoProfileDefaults } from '@/data/demo-scenario';
import { goBackOrReplace } from '@/features/navigation/go-back';
import { isProfileInputValid } from '@/features/profile/profile-form';
import { profileService } from '@/services/profile-service';
import { useAppStore } from '@/store/use-app-store';
import type { AvatarId, CreateProfileInput, LifeRhythm, UserType } from '@/types';

export default function ProfileSetupScreen() {
  const setProfile = useAppStore((state) => state.setProfile);
  const [avatarId, setAvatarId] = useState<AvatarId>(demoProfileDefaults.avatarId);
  const [profileImageUri, setProfileImageUri] = useState<string | undefined>();
  const [nickname, setNickname] = useState(demoProfileDefaults.nickname);
  const [bio, setBio] = useState('');
  const [userType, setUserType] = useState<UserType | null>(
    demoProfileDefaults.userType
  );
  const [tags, setTags] = useState<LifeRhythm[]>([...demoProfileDefaults.tags]);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isSavingRef = useRef(false);

  const canSubmit = useMemo(() => {
    if (!userType) return false;
    return isProfileInputValid({ avatarId, nickname, userType, tags });
  }, [avatarId, nickname, tags, userType]);

  async function handleSubmit() {
    if (!userType || !canSubmit || isSavingRef.current) return;

    const input: CreateProfileInput = {
      avatarId,
      profileImageUri,
      nickname,
      bio,
      userType,
      tags,
    };
    isSavingRef.current = true;
    setIsSaving(true);
    setError(null);

    try {
      const profile = await profileService.createProfile(input);
      if (!setProfile(profile)) {
        throw new Error('Profile identity did not match');
      }
      router.replace('/(tabs)');
    } catch {
      setError('プロフィールを作成できませんでした。もう一度お試しください。');
      isSavingRef.current = false;
      setIsSaving(false);
    }
  }

  return (
    <Screen contentStyle={styles.content} testID="profile-setup-screen">
      <StatusBar style="dark" />
      <View style={styles.navigation}>
        <IconButton
          icon="chevron-back"
          label="戻る"
          onPress={() => goBackOrReplace('/onboarding')}
        />
      </View>

      <View style={styles.header}>
        <AppText variant="screenTitle">プロフィールを作る</AppText>
        <AppText variant="secondary" tone="soft">
          本名や顔写真は使いません。朝の相手には、この情報だけが見えます。
        </AppText>
      </View>

      <ProfileFields
        avatarId={avatarId}
        bio={bio}
        nickname={nickname}
        onAvatarChange={setAvatarId}
        onBioChange={setBio}
        onNicknameChange={setNickname}
        onProfileImageChange={setProfileImageUri}
        onTagsChange={setTags}
        onUserTypeChange={setUserType}
        profileImageUri={profileImageUri}
        tags={tags}
        userType={userType}
      />

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
  error: {
    color: colors.danger,
  },
});
