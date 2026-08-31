import { Keyboard, StyleSheet, TextInput, View } from 'react-native';

import { AppText } from '@/components/common/app-text';
import { ChoiceChip } from '@/components/common/choice-chip';
import { AvatarPicker } from '@/components/profile/avatar-picker';
import { ProfilePhotoPicker } from '@/components/profile/profile-photo-picker';
import { prototypeConfig } from '@/constants/config';
import { lifeRhythmOptions, userTypeOptions } from '@/constants/options';
import { colors, componentSizes, fonts, radii, spacing } from '@/constants/theme';
import type { AvatarId, LifeRhythm, UserType } from '@/types';

type ProfileFieldsProps = {
  avatarId: AvatarId;
  profileImageUri?: string;
  nickname: string;
  bio: string;
  userType: UserType | null;
  tags: LifeRhythm[];
  onAvatarChange: (avatarId: AvatarId) => void;
  onProfileImageChange: (profileImageUri?: string) => void;
  onNicknameChange: (nickname: string) => void;
  onBioChange: (bio: string) => void;
  onUserTypeChange: (userType: UserType) => void;
  onTagsChange: (tags: LifeRhythm[]) => void;
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
        <AppText variant="sectionTitle">立場</AppText>
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

      <View style={styles.section}>
        <View style={styles.sectionHeading}>
          <AppText variant="sectionTitle">生活リズム</AppText>
          <AppText variant="caption" tone="muted">
            任意
          </AppText>
        </View>
        <View style={styles.chips}>
          {lifeRhythmOptions.map((rhythm) => (
            <ChoiceChip
              key={rhythm}
              label={rhythm}
              onPress={() => onTagsChange([rhythm])}
              selected={tags.includes(rhythm)}
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
