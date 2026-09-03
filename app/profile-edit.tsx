import Ionicons from '@expo/vector-icons/Ionicons';
import { Redirect, router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useMemo, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppText } from '@/components/common/app-text';
import { IconButton } from '@/components/common/icon-button';
import { Screen } from '@/components/common/screen';
import { ProfileFields } from '@/components/profile/profile-fields';
import { colors, fonts, paperColors, shadows, spacing } from '@/constants/theme';
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
  const [removeProfileImage, setRemoveProfileImage] = useState(false);
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
      removeProfileImage,
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
    <Screen
      backgroundColor={paperColors.base}
      contentStyle={styles.root}
      scroll={false}
      testID="profile-edit-screen"
    >
      <StatusBar style="dark" />

      <ScrollView
        automaticallyAdjustKeyboardInsets
        contentContainerStyle={styles.content}
        keyboardDismissMode="interactive"
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.navigation}>
          <IconButton
            icon="chevron-back"
            label="戻る"
            onPress={() => goBackOrReplace('/(tabs)/profile')}
          />
        </View>

        <View style={styles.header}>
          <View style={styles.titleBlock}>
            <AppText style={styles.eyebrow}>MY PROFILE</AppText>
            <View style={styles.titleWrap}>
              <View style={styles.titleUnderline} />
              <AppText style={styles.title}>プロフィールを編集</AppText>
            </View>
          </View>
          <AppText style={styles.description}>
            朝の相手に見える情報を変更できます。
          </AppText>
        </View>

        <ProfileFields
          editMode
          step={1}
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

        <ProfileFields
          editMode
          step={2}
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
          <View style={styles.errorCard}>
            <AppText variant="secondary" style={styles.error}>
              {error}
            </AppText>
          </View>
        ) : null}
      </ScrollView>

      <SafeAreaView edges={['bottom']} style={styles.saveBar}>
        <Pressable
          accessibilityLabel="変更を保存する"
          accessibilityRole="button"
          disabled={!canSubmit || isSaving}
          onPress={() => void handleSubmit()}
          style={({ pressed }) => [
            styles.saveButton,
            (!canSubmit || isSaving) && styles.saveButtonDisabled,
            pressed && canSubmit && !isSaving && styles.saveButtonPressed,
          ]}
          testID="profile-edit-submit"
        >
          <AppText style={styles.saveButtonText}>
            {isSaving ? '保存しています…' : '変更を確定する'}
          </AppText>
          <Ionicons name="checkmark" size={23} color={paperColors.ink} />
        </Pressable>
      </SafeAreaView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    paddingHorizontal: 0,
    paddingTop: 0,
    paddingBottom: 0,
  },
  content: {
    flexGrow: 1,
    gap: spacing.xl,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xxl,
  },
  paperLines: {
    ...StyleSheet.absoluteFillObject,
    left: -spacing.xl,
    right: -spacing.xl,
    top: 10,
  },
  paperLine: {
    height: 32,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(174, 203, 226, 0.52)',
  },
  marginLine: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: -2,
    width: 1,
    backgroundColor: 'rgba(243, 196, 197, 0.72)',
  },
  navigation: {
    minHeight: 40,
    marginLeft: -spacing.md,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  header: {
    gap: spacing.sm,
  },
  titleBlock: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    backgroundColor: paperColors.base,
    transform: [{ rotate: '-0.8deg' }],
  },
  eyebrow: {
    color: paperColors.ink,
    fontSize: 10,
    lineHeight: 14,
    letterSpacing: 1.5,
  },
  title: {
    zIndex: 1,
    color: paperColors.ink,
    fontFamily: fonts?.rounded,
    fontSize: 26,
    lineHeight: 34,
  },
  titleWrap: {
    position: 'relative',
    alignSelf: 'flex-start',
  },
  titleUnderline: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 2,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(174, 203, 226, 0.88)',
  },
  description: {
    paddingHorizontal: spacing.sm,
    color: paperColors.ink,
    fontSize: 13,
    lineHeight: 20,
  },
  errorCard: {
    padding: spacing.md,
    borderWidth: 2,
    borderColor: paperColors.ink,
    borderRadius: 8,
    backgroundColor: paperColors.base,
  },
  error: {
    color: colors.danger,
  },
  saveBar: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
    borderTopWidth: 2,
    borderTopColor: paperColors.ruleBlue,
    backgroundColor: 'rgba(246, 246, 246, 0.98)',
    shadowColor: paperColors.ink,
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.12,
    shadowRadius: 7,
    elevation: 8,
  },
  saveButton: {
    minHeight: 58,
    paddingHorizontal: spacing.xl,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    borderWidth: 2,
    borderColor: paperColors.ink,
    borderRadius: 9,
    backgroundColor: paperColors.salmon,
    transform: [{ rotate: '-0.4deg' }],
    ...shadows.paper,
  },
  saveButtonPressed: {
    opacity: 0.72,
    transform: [{ rotate: '-0.4deg' }, { translateY: 1 }],
  },
  saveButtonDisabled: {
    opacity: 0.4,
  },
  saveButtonText: {
    color: paperColors.ink,
    fontFamily: fonts?.rounded,
    fontSize: 18,
    lineHeight: 24,
  },
});
