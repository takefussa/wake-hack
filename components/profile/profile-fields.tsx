import {
  Keyboard,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';

import { AppText } from '@/components/common/app-text';
import { ChoiceChip } from '@/components/common/choice-chip';
import { AvatarPicker } from '@/components/profile/avatar-picker';
import { ProfilePhotoPicker } from '@/components/profile/profile-photo-picker';
import { prototypeConfig } from '@/constants/config';
import {
  lifeRhythmOptions,
  userTypeOptions,
} from '@/constants/options';
import {
  colors,
  fonts,
  paperColors,
  shadows,
} from '@/constants/theme';
import type {
  AvatarId,
  LifeRhythm,
  UserType,
} from '@/types';

type ProfileFieldsProps = {
  step: 1 | 2;
  editMode?: boolean;

  avatarId: AvatarId;
  profileImageUri?: string;
  nickname: string;
  bio: string;
  userType: UserType | null;
  tags: LifeRhythm[];
  onAvatarChange: (avatarId: AvatarId) => void;
  onProfileImageChange: (
    profileImageUri?: string
  ) => void;
  onNicknameChange: (nickname: string) => void;
  onBioChange: (bio: string) => void;
  onUserTypeChange: (
    userType: UserType
  ) => void;
  onTagsChange: (
    tags: LifeRhythm[]
  ) => void;
};

export function ProfileFields({
  step,
  editMode = false,
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
  if (step === 1) {
    return (
      <View style={styles.page}>
        {/* 写真 */}
        <View style={styles.paperSection}>
          <View style={styles.blueTape} />

          <View style={styles.headingRow}>
            <AppText style={styles.sectionTitle}>
              プロフィール画像
            </AppText>

            <AppText style={styles.optional}>
              任意
            </AppText>
          </View>

          <View style={styles.profileImageRow}>
            <ProfilePhotoPicker
              avatarId={avatarId}
              imageUri={profileImageUri}
              name={nickname || 'あなた'}
              onChange={onProfileImageChange}
            />

            <View style={styles.avatarCandidates}>
              <AvatarPicker
                value={avatarId}
                onChange={onAvatarChange}
              />
              <AppText style={styles.avatarHint}>アイコン候補</AppText>
            </View>
          </View>
        </View>

        {/* ニックネーム */}
        <View style={styles.section}>
          <View style={styles.labelRow}>
            <View style={styles.titleWithRequired}>
              <AppText style={styles.sectionTitle}>
                ニックネーム
              </AppText>

              <View style={styles.requiredBadge}>
                <AppText
                  style={styles.requiredBadgeText}
                >
                  必須
                </AppText>
              </View>
            </View>

            <AppText style={styles.counter}>
              {nickname.length}/
              {
                prototypeConfig.profileNicknameMaxLength
              }
            </AppText>
          </View>

          <View style={styles.inputPaper}>
            <TextInput
              accessibilityLabel="ニックネーム"
              autoCapitalize="none"
              autoCorrect={false}
              maxLength={
                prototypeConfig.profileNicknameMaxLength
              }
              onChangeText={onNicknameChange}
              onSubmitEditing={Keyboard.dismiss}
              placeholder="例：Takuma"
              placeholderTextColor={
                colors.textTertiary
              }
              returnKeyType="done"
              selectionColor="#7898A7"
              style={styles.input}
              value={nickname}
            />
          </View>

          <AppText style={styles.helper}>
            朝の相手に表示される名前です。
          </AppText>
        </View>

        {/* 属性 */}
        <View style={styles.section}>
          <View style={styles.titleWithRequired}>
            <AppText style={styles.sectionTitle}>
              あなたについて
            </AppText>

            <View style={styles.requiredBadge}>
              <AppText
                style={styles.requiredBadgeText}
              >
                必須
              </AppText>
            </View>
          </View>

          <AppText style={styles.helper}>
            近いものをひとつ選んでください。
          </AppText>

          <View style={styles.chips}>
            {userTypeOptions.map((option) => (
              <ChoiceChip
                emphasized={editMode}
                key={option}
                label={option}
                onPress={() =>
                  onUserTypeChange(option)
                }
                selected={
                  userType === option
                }
              />
            ))}
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.page}>
      {/* タグ */}
      <View style={styles.paperSection}>
        <View style={styles.pinkTape} />

        <View style={styles.headingRow}>
          <AppText style={styles.sectionTitle}>
            朝について
          </AppText>

          <AppText style={styles.optional}>
            任意
          </AppText>
        </View>

        <AppText style={styles.helper}>
          相手が声をかけるヒントになります。
        </AppText>

        <View style={styles.chips}>
          {lifeRhythmOptions.map((rhythm) => (
            <ChoiceChip
              emphasized={editMode}
              key={rhythm}
              label={rhythm}
              onPress={() => onTagsChange([rhythm])}
              selected={tags.includes(rhythm)}
            />
          ))}
        </View>
      </View>

      {/* bio */}
      <View style={styles.section}>
        <View style={styles.labelRow}>
          <View style={styles.headingRow}>
            <AppText style={styles.sectionTitle}>
              一言
            </AppText>

            <AppText style={styles.optional}>
              任意
            </AppText>
          </View>

          <AppText style={styles.counter}>
            {bio.length}/
            {prototypeConfig.profileBioMaxLength}
          </AppText>
        </View>

        <View style={styles.bioPaper}>
          <TextInput
            accessibilityLabel="一言コメント"
            maxLength={
              prototypeConfig.profileBioMaxLength
            }
            multiline
            onChangeText={onBioChange}
            placeholder={
              '例：朝は苦手だけど、\nゆっくり頑張ります。'
            }
            placeholderTextColor={
              colors.textTertiary
            }
            selectionColor="#7898A7"
            style={[styles.input, styles.bioInput]}
            textAlignVertical="top"
            value={bio}
          />
        </View>

        <AppText style={styles.helper}>
          自分のことを少しだけ書いておくと、
          声を届けやすくなります。
        </AppText>
      </View>

      {/* 小さいメモ */}
      <View style={[styles.note, editMode && styles.noteGray]}>
        <AppText style={styles.noteEmoji}>
          ✎
        </AppText>

        <AppText style={styles.noteText}>
          ここで入力した内容は、
          あとからプロフィールで変更できます。
        </AppText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  page: {
    gap: 22,
  },

  section: {
    position: 'relative',
    paddingHorizontal: 18,
    paddingVertical: 18,
    gap: 12,
    backgroundColor: paperColors.base,
    borderWidth: 2,
    borderColor: paperColors.ink,
    borderRadius: 12,
    ...shadows.paper,
  },

  paperSection: {
    position: 'relative',

    paddingHorizontal: 18,
    paddingTop: 20,
    paddingBottom: 18,

    gap: 14,

    backgroundColor: paperColors.base,

    borderWidth: 2,
    borderColor: paperColors.ink,
    borderRadius: 12,
    ...shadows.paper,

    transform: [{ rotate: '-0.25deg' }],
  },

  blueTape: {
    position: 'absolute',

    top: -7,
    left: 26,

    width: 72,
    height: 16,
    backgroundColor: 'rgba(174, 203, 226, 0.68)',

    transform: [{ rotate: '-4deg' }],
  },

  pinkTape: {
    position: 'absolute',

    top: -7,
    right: 28,

    width: 72,
    height: 16,

    backgroundColor: 'rgba(174, 203, 226, 0.68)',

    transform: [{ rotate: '4deg' }],
  },

  headingRow: {
    flexDirection: 'row',
    alignItems: 'center',

    gap: 9,
  },

  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',

    gap: 12,
  },

  titleWithRequired: {
    flexDirection: 'row',
    alignItems: 'center',

    gap: 9,
  },

  sectionTitle: {
    color: paperColors.ink,

    fontSize: 19,
    lineHeight: 25,
    fontFamily: fonts?.handwritten,
    letterSpacing: 0.7,
  },

  requiredBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,

    borderRadius: 5,

    backgroundColor: '#F3C4C5',
  },

  requiredBadgeText: {
    color: '#6D4F59',

    fontSize: 9,
    fontWeight: '800',
  },

  optional: {
    color: '#747C87',

    fontSize: 10,
    fontWeight: '600',
  },

  counter: {
    color: '#747C87',

    fontSize: 10,
  },

  helper: {
    color: '#626C78',

    fontSize: 11,
    lineHeight: 16,
    fontFamily: fonts?.handwritten,
  },

  profileImageRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'flex-start',
    flexWrap: 'wrap',

    gap: 12,
  },

  avatarCandidates: {
    flexShrink: 0,
    alignItems: 'center',

    gap: 6,

    marginTop: 0,
    marginRight: 4,
  },

  avatarHint: {
    color: '#7B838D',

    fontSize: 9,
    fontWeight: '600',
  },

  inputPaper: {
    backgroundColor: '#FFFFFF',

    borderWidth: 2,
    borderColor: paperColors.ink,
    borderRadius: 8,
    ...shadows.paper,
  },

  input: {
    minHeight: 50,

    paddingHorizontal: 16,

    color: '#3E4959',

    fontFamily: fonts?.handwritten,
    fontSize: 15,

    backgroundColor: 'transparent',
  },

  bioPaper: {
    backgroundColor: '#FFFFFF',

    borderWidth: 2,
    borderColor: paperColors.ink,
    borderRadius: 8,
    ...shadows.paper,

    transform: [{ rotate: '0.25deg' }],
  },

  bioInput: {
    minHeight: 108,

    paddingTop: 13,
    paddingBottom: 13,

    lineHeight: 21,
  },

  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',

    gap: 10,
  },

  note: {
    marginHorizontal: 8,

    paddingHorizontal: 14,
    paddingVertical: 12,

    flexDirection: 'row',
    alignItems: 'center',

    gap: 9,

    backgroundColor: paperColors.paleYellow,

    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: paperColors.ink,
    borderRadius: 10,
    ...shadows.paper,
  },

  noteGray: {
    backgroundColor: paperColors.clockGray,
  },

  noteEmoji: {
    color: '#66717E',

    fontSize: 16,
  },

  noteText: {
    flex: 1,

    color: '#596573',

    fontSize: 10,
    lineHeight: 15,
    fontFamily: fonts?.handwritten,
  },
});
