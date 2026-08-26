import { Keyboard, StyleSheet, TextInput, View } from 'react-native';

import { AppText } from '@/components/common/app-text';
import { ChoiceChip } from '@/components/common/choice-chip';
import { AvatarPicker } from '@/components/profile/avatar-picker';
import { ProfilePhotoPicker } from '@/components/profile/profile-photo-picker';
import { prototypeConfig } from '@/constants/config';
import { profileTagOptions, userTypeOptions } from '@/constants/options';
import { colors, componentSizes, fonts, radii, spacing } from '@/constants/theme';
import { toggleProfileTag } from '@/features/profile/profile-form';
import type { AvatarId, ProfileTag, UserType } from '@/types';

type ProfileFieldsProps = {
  avatarId: AvatarId;
  profileImageUri?: string;
  nickname: string;
  bio: string;
  userType: UserType | null;
  tags: ProfileTag[];
  onAvatarChange: (avatarId: AvatarId) => void;
  onProfileImageChange: (profileImageUri?: string) => void;
  onNicknameChange: (nickname: string) => void;
  onBioChange: (bio: string) => void;
  onUserTypeChange: (userType: UserType) => void;
  onTagsChange: (tags: ProfileTag[]) => void;
  /** 'onboarding' hides the optional tags/bio fields, deferring them to profile editing later. */
  variant?: 'onboarding' | 'full';
};

export function ProfileFields({
  avatarId,
  profileImageUri,
  nickname,
  bio,
  userType,
  tags,
  onAvatarChange,
  onProfileImageChange,
  onNicknameChange,
  onBioChange,
  onUserTypeChange,
  onTagsChange,
  variant = 'full',
}: ProfileFieldsProps) {
  return (
    <>
      <View style={styles.section}>
        <AppText variant="sectionTitle">プロフィール画像</AppText>
        <ProfilePhotoPicker
          avatarId={avatarId}
          imageUri={profileImageUri}
          name={nickname || 'あなた'}
          onChange={onProfileImageChange}
        />
        <AppText variant="caption" tone="muted">
          写真を使わない場合のアイコン
        </AppText>
        <AvatarPicker value={avatarId} onChange={onAvatarChange} />
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
          onChangeText={onNicknameChange}
          onSubmitEditing={Keyboard.dismiss}
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
              onPress={() => onUserTypeChange(option)}
              selected={userType === option}
            />
          ))}
        </View>
      </View>

      {variant === 'full' ? (
        <>
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
                  onPress={() => onTagsChange(toggleProfileTag(tags, tag))}
                  selected={tags.includes(tag)}
                />
              ))}
            </View>
          </View>

          <View style={styles.section}>
            <View style={styles.labelRow}>
              <View style={styles.fieldLabel}>
                <AppText variant="sectionTitle">一言コメント</AppText>
                <AppText variant="caption" tone="muted">
                  任意
                </AppText>
              </View>
              <AppText variant="caption" tone="muted">
                {bio.length}/{prototypeConfig.profileBioMaxLength}
              </AppText>
            </View>
            <TextInput
              accessibilityLabel="一言コメント"
              maxLength={prototypeConfig.profileBioMaxLength}
              multiline
              onChangeText={onBioChange}
              placeholder="例：朝は苦手だけど、ゆっくり頑張ります。"
              placeholderTextColor={colors.textTertiary}
              selectionColor={colors.indigo}
              style={[styles.input, styles.bioInput]}
              textAlignVertical="top"
              value={bio}
            />
          </View>
        </>
      ) : null}
    </>
  );
}

const styles = StyleSheet.create({
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
  fieldLabel: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: spacing.sm,
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
  bioInput: {
    minHeight: 96,
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
  },
});
