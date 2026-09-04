import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useMemo, useRef, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppButton } from '@/components/common/app-button';
import { AppText } from '@/components/common/app-text';
import { IconButton } from '@/components/common/icon-button';
import { Screen } from '@/components/common/screen';
import { ProfileFields } from '@/components/profile/profile-fields';
import { colors, fonts, spacing } from '@/constants/theme';
import { demoProfileDefaults } from '@/data/demo-scenario';
import { goBackOrReplace } from '@/features/navigation/go-back';
import { onboardingRoute } from '@/features/navigation/onboarding-route';
import { isProfileInputValid } from '@/features/profile/profile-form';
import { logDevelopmentError } from '@/lib/development-logger';
import { authService } from '@/services/auth-service';
import { profileService } from '@/services/profile-service';
import { useAppStore } from '@/store/use-app-store';
import type {
  AvatarId,
  CreateProfileInput,
  LifeRhythm,
  UserType,
} from '@/types';

type ProfileStep = 1 | 2;

export default function ProfileSetupScreen() {
  const setProfile = useAppStore((state) => state.setProfile);
  const setAuthenticatedUserId = useAppStore(
    (state) => state.setAuthenticatedUserId
  );

  const [step, setStep] = useState<ProfileStep>(1);

  const [avatarId, setAvatarId] = useState<AvatarId>(
    demoProfileDefaults.avatarId
  );

  const [profileImageUri, setProfileImageUri] = useState<
    string | undefined
  >();

  const [nickname, setNickname] = useState(
    demoProfileDefaults.nickname
  );

  const [bio, setBio] = useState('');

  const [userType, setUserType] = useState<UserType | null>(
    demoProfileDefaults.userType
  );
  const [tags, setTags] = useState<LifeRhythm[]>([...demoProfileDefaults.tags]);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isSavingRef = useRef(false);

  const canGoNext =
    nickname.trim().length > 0 && userType !== null;

  const canSubmit = useMemo(() => {
    if (!userType) return false;

    return isProfileInputValid({
      avatarId,
      nickname,
      userType,
      tags,
    });
  }, [avatarId, nickname, tags, userType]);

  function handleBack() {
    if (step === 2) {
      setStep(1);
      return;
    }

    goBackOrReplace(onboardingRoute);
  }

  function handleNext() {
    if (!canGoNext) return;

    setError(null);
    setStep(2);
  }

  async function handleSubmit(skipOptional = false) {
    if (!userType || !canSubmit || isSavingRef.current) {
      return;
    }

    const input: CreateProfileInput = {
      avatarId,
      profileImageUri,
      nickname,
      bio: skipOptional ? '' : bio,
      userType,
      tags: skipOptional ? [] : tags,
    };

    isSavingRef.current = true;
    setIsSaving(true);
    setError(null);

    try {
      const user = await authService.initializeSession();
      setAuthenticatedUserId(user.id);

      const profile = await profileService.createProfile(input);

      if (!setProfile(profile)) {
        throw new Error('Profile identity did not match');
      }

      router.replace('/(tabs)');
    } catch (error) {
      logDevelopmentError('profile.create.submit', error);
      setError(
        'プロフィールを作成できませんでした。もう一度お試しください。'
      );

      isSavingRef.current = false;
      setIsSaving(false);
    }
  }

  return (
    <Screen
      backgroundColor="#F6F6F6"
      contentStyle={styles.content}
      testID="profile-setup-screen"
    >
      <StatusBar style="dark" />

      <View style={styles.navigation}>
        <IconButton
          icon="chevron-back"
          label="戻る"
          onPress={handleBack}
        />

        {step === 2 && (
          <Pressable
            accessibilityRole="button"
            disabled={isSaving}
            hitSlop={10}
            onPress={() => void handleSubmit(true)}
            style={({ pressed }) => [
              styles.skipButton,
              pressed && styles.skipButtonPressed,
            ]}>
            <AppText style={styles.skipButtonText}>
              スキップ
            </AppText>
          </Pressable>
        )}
      </View>

      <View style={styles.header}>
        <View style={styles.headerTitleWrap}>
          <View
            style={[
              styles.headerMarker,
              step === 1 ? styles.headerMarkerBlue : styles.headerMarkerPink,
            ]}
          />
          <AppText variant="screenTitle" style={styles.headerTitle}>
            プロフィールを作る
          </AppText>
        </View>

        {step === 1 && (
          <AppText variant="secondary" tone="soft" style={styles.headerDescription}>
            まずは、声を届ける相手に見える基本情報を設定します。
          </AppText>
        )}

        <AppText
          style={[
            styles.stepLabel,
            step === 1 ? styles.stepLabelBlue : styles.stepLabelPink,
          ]}>
          {step} / 2
        </AppText>
      </View>

      <ProfileFields
        step={step}
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
        <AppText
          variant="secondary"
          style={styles.error}
        >
          {error}
        </AppText>
      ) : null}

      {step === 1 ? (
        <AppButton
          buttonColor="#F3C4C5"
          disabled={!canGoNext}
          label="次へ"
          onPress={handleNext}
          testID="profile-next"
        />
      ) : (
        <AppButton
          buttonColor="#F3C4C5"
          disabled={!canSubmit || isSaving}
          label={
            isSaving
              ? '作成しています…'
              : 'プロフィールを作成'
          }
          onPress={() => void handleSubmit(false)}
          testID="profile-submit"
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    position: 'relative',
    flexGrow: 1,
    justifyContent: 'space-between',
    gap: 20,
    paddingTop: 12,
    paddingBottom: 28,
  },

  paperLines: {
    ...StyleSheet.absoluteFillObject,
    left: -spacing.xl,
    right: -spacing.xl,
    top: 16,
  },

  paperLine: {
    height: 32,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(116, 151, 166, 0.13)',
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
    marginLeft: -spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 34,
  },

  skipButton: {
    minHeight: 32,
    paddingHorizontal: spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },

  skipButtonPressed: {
    opacity: 0.55,
  },

  skipButtonText: {
    color: '#465363',
    fontSize: 13,
    fontWeight: '600',
  },

  header: {
    gap: 8,
  },

  headerTitleWrap: {
    position: 'relative',
    alignSelf: 'flex-start',
  },

  headerMarker: {
    position: 'absolute',
    left: -3,
    right: -8,
    bottom: 3,
    height: 9,
    borderRadius: 5,
    transform: [{ rotate: '-1deg' }],
  },

  headerMarkerBlue: {
    backgroundColor: 'rgba(220, 238, 251, 0.92)',
  },

  headerMarkerPink: {
    backgroundColor: 'rgba(174, 203, 226, 0.72)',
  },

  headerTitle: {
    color: '#3E4959',
    fontFamily: fonts?.handwritten,
    letterSpacing: 1,
  },

  headerDescription: {
    color: '#596473',
    fontFamily: fonts?.handwritten,
  },

  stepLabel: {
    alignSelf: 'flex-start',

    marginTop: 0,

    paddingHorizontal: 9,
    paddingVertical: 3,

    color: '#465363',

    fontSize: 11,
    fontWeight: '800',
    fontFamily: fonts?.handwritten,

    transform: [{ rotate: '-2deg' }],
  },

  stepLabelBlue: {
    backgroundColor: '#DCEEFB',
  },

  stepLabelPink: {
    backgroundColor: '#F3C4C5',
  },

  error: {
    color: colors.danger,
  },
});
