import { Redirect, router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useMemo, useRef, useState } from 'react';
import { StyleSheet } from 'react-native';

import { AppButton } from '@/components/common/app-button';
import { AppText } from '@/components/common/app-text';
import { Screen } from '@/components/common/screen';
import { ScreenHeader } from '@/components/common/screen-header';
import { ProfileFields } from '@/components/profile/profile-fields';
import { colors, spacing } from '@/constants/theme';
import { goBackOrReplace } from '@/features/navigation/go-back';
import { isProfileInputValid } from '@/features/profile/profile-form';
import { profileService } from '@/services/profile-service';
import { useAppStore } from '@/store/use-app-store';
import type { AvatarId, LifeRhythm, UpdateProfileInput, UserType } from '@/types';

export default function ProfileEditScreen() {
  const currentUser = useAppStore((state) => state.currentUser);
  const updateProfile = useAppStore((state) => state.updateProfile);
  const [avatarId, setAvatarId] = useState<AvatarId>(currentUser?.avatarId ?? 'luna');
  const [profileImageUri, setProfileImageUri] = useState<string | undefined>(
    currentUser?.profileImageUri
  );
  const [nickname, setNickname] = useState(currentUser?.nickname ?? '');
  const [bio, setBio] = useState(currentUser?.bio ?? '');
  const [userType, setUserType] = useState<UserType | null>(currentUser?.userType ?? null);
  const [tags, setTags] = useState<LifeRhythm[]>(currentUser?.tags ?? []);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isSavingRef = useRef(false);

  const canSubmit = useMemo(() => {
    if (!userType) return false;
    return isProfileInputValid({ avatarId, nickname, userType, tags });
  }, [avatarId, nickname, tags, userType]);

  if (!currentUser) {
    return <Redirect href="/onboarding" />;
  }

  async function handleSubmit() {
    if (!currentUser || !userType || !canSubmit || isSavingRef.current) return;

    const input: UpdateProfileInput = {
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
      const profile = await profileService.updateProfile(currentUser, input);
      if (!updateProfile(profile)) {
        throw new Error('Profile identity did not match');
      }
      router.replace('/(tabs)/profile');
    } catch {
      setError('プロフィールを保存できませんでした。もう一度お試しください。');
      isSavingRef.current = false;
      setIsSaving(false);
    }
  }

  return (
    <Screen contentStyle={styles.content} testID="profile-edit-screen">
      <StatusBar style="dark" />
      <ScreenHeader
        description="朝の相手に見える情報を変更できます。"
        onBack={() => goBackOrReplace('/(tabs)/profile')}
        title="プロフィールを編集"
      />

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
        label={isSaving ? '保存しています…' : '変更を保存'}
        onPress={() => void handleSubmit()}
        testID="profile-edit-submit"
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: spacing.xxl,
  },
  error: {
    color: colors.danger,
  },
});
