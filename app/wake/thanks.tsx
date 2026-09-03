import Ionicons from '@expo/vector-icons/Ionicons';
import * as Haptics from 'expo-haptics';
import { Redirect, router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useRef, useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';

import { AppButton } from '@/components/common/app-button';
import { AppText } from '@/components/common/app-text';
import { Avatar } from '@/components/common/avatar';
import { IconButton } from '@/components/common/icon-button';
import { MorningScreen } from '@/components/wake/morning-screen';
import { prototypeConfig } from '@/constants/config';
import { thanksReactionOptions } from '@/constants/options';
import { colors, fonts, paperColors, radii, shadows, spacing } from '@/constants/theme';
import { goBackOrReplace } from '@/features/navigation/go-back';
import { isWakeContextValid } from '@/features/wake/is-wake-context-valid';
import { useVoiceSender } from '@/hooks/use-voice-sender';
import { thanksService } from '@/services/thanks-service';
import { useAppStore } from '@/store/use-app-store';

export default function ThanksSendScreen() {
  const currentUser = useAppStore((state) => state.currentUser);
  const currentMorningRequest = useAppStore((state) => state.currentMorningRequest);
  const assignedWakeVoice = useAppStore((state) => state.assignedWakeVoice);
  const wakeSession = useAppStore((state) => state.wakeSession);
  const thanksMessages = useAppStore((state) => state.thanksMessages);
  const addThanksMessages = useAppStore((state) => state.addThanksMessages);
  const sender = useVoiceSender(assignedWakeVoice);
  const [text, setText] = useState('');
  const [addToOkimate, setAddToOkimate] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isSendingRef = useRef(false);

  if (!currentUser || !currentMorningRequest || !assignedWakeVoice || !wakeSession) {
    return <Redirect href="/morning/ready" />;
  }
  if (
    !isWakeContextValid({
      currentUser,
      morningRequest: currentMorningRequest,
      voice: assignedWakeVoice,
      wakeSession,
    })
  ) {
    return <Redirect href="/morning/ready" />;
  }
  if (wakeSession.status !== 'completed') {
    return <Redirect href="/wake/alarm" />;
  }

  const isPersonal = assignedWakeVoice.type === 'personal';
  const hasSentThanks = thanksMessages.some(
    (message) =>
      message.senderId === currentUser.id &&
      message.sourceVoiceMessageId === assignedWakeVoice.id
  );

  if (hasSentThanks) {
    return <Redirect href={isPersonal ? '/friend/request' : '/(tabs)/connections'} />;
  }

  async function handleSend() {
    if (
      !currentUser ||
      !assignedWakeVoice ||
      isSendingRef.current ||
      !text.trim()
    ) return;

    isSendingRef.current = true;
    setIsSending(true);
    setError(null);
    try {
      const messages = await thanksService.send({
        senderId: currentUser.id,
        receiverId: isPersonal ? assignedWakeVoice.senderId : 'community',
        sourceVoiceMessageId: assignedWakeVoice.id,
        reaction: thanksReactionOptions[0],
        text,
      });
      addThanksMessages(messages);
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(
        () => undefined
      );
      router.replace(isPersonal && addToOkimate ? '/friend/request' : '/(tabs)');
    } catch {
      setError('ありがとうを届けられませんでした。もう一度お試しください。');
      isSendingRef.current = false;
      setIsSending(false);
    }
  }

  return (
    <MorningScreen contentStyle={styles.content} testID="thanks-send-screen">
      <StatusBar style="dark" />

      <View style={styles.navigation}>
        <IconButton
          icon="chevron-back"
          label="完了画面に戻る"
          onPress={() => goBackOrReplace('/wake/complete')}
        />
        <Pressable
          accessibilityRole="button"
          onPress={() => router.replace('/(tabs)')}
          style={({ pressed }) => [styles.skipButton, pressed && styles.pressed]}
        >
          <AppText style={styles.skipText}>スキップしてホームへ</AppText>
        </Pressable>
      </View>

      <View style={styles.heading}>
        <AppText
          adjustsFontSizeToFit
          minimumFontScale={0.8}
          numberOfLines={1}
          style={styles.title}
        >
          ありがとうを届ける
        </AppText>
        <View pointerEvents="none" style={styles.titleUnderline} />
        <AppText style={styles.description}>
          {
          isPersonal
            ? `${sender?.nickname ?? '声をくれた人'}さんへ、起きられたことを短く返します。`
            : '今朝の声を届けてくれたみんなへ、起きられたことを返します。'
          }
        </AppText>
      </View>

      <View style={styles.recipient}>
        <View pointerEvents="none" style={styles.greenTape} />
        <View style={styles.recipientHeader}>
          {isPersonal ? (
            <Avatar
              avatarId={sender?.avatarId ?? 'sky'}
              imageUri={sender?.profileImageUri}
              name={sender?.nickname ?? 'Takuma'}
              size={72}
            />
          ) : (
            <View style={styles.communityAvatar}>
              <Ionicons color={colors.indigo} name="people-outline" size={24} />
            </View>
          )}
          <View style={styles.recipientCopy}>
            <AppText style={styles.recipientName}>
              {isPersonal ? `${sender?.nickname ?? '誰か'}さん` : 'オキタ！のみんな'}
            </AppText>
            <AppText variant="caption" tone="muted">
              {isPersonal ? sender?.userType : 'みんなに向けた声へのリアクション'}
            </AppText>
          </View>
        </View>
        {isPersonal ? (
          <>
            {sender?.tags?.length ? (
              <View style={styles.profileTags}>
                {sender.tags.map((tag) => (
                  <View key={tag} style={styles.profileTag}>
                    <AppText style={styles.profileTagText}>#{tag}</AppText>
                  </View>
                ))}
              </View>
            ) : null}
            <AppText style={styles.profileBio}>
              {sender?.bio || '一言プロフィールはまだありません。'}
            </AppText>
          </>
        ) : null}
      </View>

      <View style={styles.section}>
        <View style={styles.labelRow}>
          <AppText variant="sectionTitle">一言メッセージ</AppText>
          <AppText variant="caption" tone="muted">
            {text.length}/{prototypeConfig.thanksTextMaxLength}
          </AppText>
        </View>
        <TextInput
          accessibilityLabel="ありがとうのメッセージ"
          maxLength={prototypeConfig.thanksTextMaxLength}
          onChangeText={setText}
          placeholder="声のおかげで、落ち着いて起きられました。"
          placeholderTextColor={colors.textTertiary}
          selectionColor={colors.indigo}
          style={styles.input}
          textAlignVertical="top"
          value={text}
        />
      </View>

      {isPersonal ? (
        <Pressable
          accessibilityRole="checkbox"
          accessibilityState={{ checked: addToOkimate }}
          onPress={() => setAddToOkimate((current) => !current)}
          style={({ pressed }) => [
            styles.okimateChoice,
            addToOkimate && styles.okimateChoiceSelected,
            pressed && styles.pressed,
          ]}
        >
          <View style={styles.okimateIcon}>
            <Ionicons
              color={paperColors.ink}
              name={addToOkimate ? 'checkmark' : 'person-add-outline'}
              size={20}
            />
          </View>
          <View style={styles.okimateCopy}>
            <AppText style={styles.okimateTitle}>オキメイトに追加</AppText>
            <AppText variant="caption" tone="muted">
              選択すると、ありがとうを届けた後に追加画面へ進みます。
            </AppText>
          </View>
        </Pressable>
      ) : null}

      {error ? (
        <AppText variant="secondary" style={styles.error}>
          {error}
        </AppText>
      ) : null}

      <View style={styles.footer}>
        <AppButton
          buttonColor={paperColors.orange}
          contentColor={paperColors.ink}
          disabled={isSending || !text.trim()}
          icon="heart-outline"
          label={isSending ? '届けています…' : 'ありがとうを届ける'}
          onPress={() => void handleSend()}
          style={styles.primaryAction}
          testID="send-thanks"
          variant="warm"
        />
        <AppButton
          contentColor={colors.success}
          label="ホームへ戻る"
          onPress={() => router.replace('/(tabs)')}
          variant="text"
        />
      </View>
    </MorningScreen>
  );
}

const styles = StyleSheet.create({
  content: {
    justifyContent: 'space-between',
    gap: spacing.xl,
  },
  navigation: {
    minHeight: 44,
    marginLeft: -spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  skipButton: {
    minHeight: 40,
    justifyContent: 'center',
    paddingHorizontal: spacing.xs,
  },
  skipText: {
    color: colors.success,
    fontSize: 13,
    lineHeight: 18,
    borderBottomWidth: 2,
    borderBottomColor: colors.success,
  },
  pressed: {
    opacity: 0.65,
  },
  heading: {
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    gap: spacing.md,
  },
  title: {
    width: '100%',
    fontFamily: fonts?.handwritten,
    fontSize: 36,
    lineHeight: 44,
    textAlign: 'center',
  },
  titleUnderline: {
    width: 210,
    height: 8,
    marginTop: -spacing.md,
    borderRadius: 4,
    backgroundColor: paperColors.orange,
    opacity: 0.72,
    transform: [{ rotate: '-1deg' }],
  },
  description: {
    fontSize: 17,
    lineHeight: 26,
    textAlign: 'center',
  },
  recipient: {
    position: 'relative',
    padding: spacing.lg,
    borderWidth: 2,
    borderColor: paperColors.ink,
    borderRadius: 18,
    backgroundColor: paperColors.cardGray,
    gap: spacing.md,
    ...shadows.paper,
  },
  recipientHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  communityAvatar: {
    width: 56,
    height: 56,
    borderRadius: radii.avatar,
    borderWidth: 2,
    borderColor: paperColors.ink,
    backgroundColor: colors.indigoSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  recipientCopy: {
    flex: 1,
    gap: spacing.xs,
  },
  recipientName: {
    fontSize: 24,
    lineHeight: 31,
  },
  profileTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  profileTag: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    backgroundColor: paperColors.noteBlue,
  },
  profileTagText: {
    fontSize: 12,
    lineHeight: 17,
  },
  profileBio: {
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: paperColors.clockGray,
    fontSize: 14,
    lineHeight: 22,
  },
  section: {
    padding: spacing.lg,
    borderWidth: 2,
    borderColor: paperColors.ink,
    borderRadius: 18,
    backgroundColor: paperColors.base,
    gap: spacing.md,
    ...shadows.paper,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  input: {
    minHeight: 56,
    borderRadius: radii.input,
    borderWidth: 2,
    borderColor: paperColors.ink,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    color: colors.text,
    fontFamily: fonts?.sans,
    fontSize: 16,
    lineHeight: 24,
    letterSpacing: 0,
  },
  error: {
    color: colors.danger,
  },
  okimateChoice: {
    minHeight: 78,
    padding: spacing.md,
    borderWidth: 2,
    borderColor: paperColors.ink,
    borderRadius: 18,
    backgroundColor: paperColors.base,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    ...shadows.paper,
  },
  okimateChoiceSelected: {
    backgroundColor: paperColors.salmon,
  },
  okimateIcon: {
    width: 42,
    height: 42,
    borderWidth: 2,
    borderColor: paperColors.ink,
    borderRadius: 21,
    backgroundColor: paperColors.noteBlue,
    alignItems: 'center',
    justifyContent: 'center',
  },
  okimateCopy: {
    flex: 1,
    gap: spacing.xs,
  },
  okimateTitle: {
    fontSize: 18,
    lineHeight: 24,
  },
  greenTape: {
    position: 'absolute',
    top: -13,
    left: '34%',
    right: '34%',
    zIndex: 2,
    height: 24,
    backgroundColor: colors.success,
    opacity: 0.82,
    transform: [{ rotate: '1deg' }],
  },
  footer: {
    padding: spacing.lg,
    borderWidth: 2,
    borderColor: paperColors.ink,
    borderRadius: 18,
    backgroundColor: paperColors.base,
    ...shadows.paper,
  },
  primaryAction: {
    borderWidth: 2,
    borderColor: paperColors.ink,
  },
});
