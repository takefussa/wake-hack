import Ionicons from '@expo/vector-icons/Ionicons';
import * as Haptics from 'expo-haptics';
import { Redirect, router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef, useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';

import { AppButton } from '@/components/common/app-button';
import { AppText } from '@/components/common/app-text';
import { Avatar } from '@/components/common/avatar';
import { ChoiceChip } from '@/components/common/choice-chip';
import { IconButton } from '@/components/common/icon-button';
import { MorningScreen } from '@/components/wake/morning-screen';
import { prototypeConfig } from '@/constants/config';
import { thanksReactionOptions } from '@/constants/options';
import { colors, fonts, paperColors, radii, shadows, spacing } from '@/constants/theme';
import { goBackOrReplace } from '@/features/navigation/go-back';
import { isWakeContextValid } from '@/features/wake/is-wake-context-valid';
import { useVoiceSender } from '@/hooks/use-voice-sender';
import { communityVoiceService } from '@/services/community-voice-service';
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
  const [reaction, setReaction] = useState<string | null>(null);
  const [text, setText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [remoteHasSentThanks, setRemoteHasSentThanks] = useState(false);
  const isSendingRef = useRef(false);

  useEffect(() => {
    let isMounted = true;

    async function checkCommunityThanks() {
      if (!currentUser || assignedWakeVoice?.type !== 'community') {
        setRemoteHasSentThanks(false);
        return;
      }

      const hasThanks = await communityVoiceService.hasThanks(
        assignedWakeVoice.sourceVoiceId ?? assignedWakeVoice.id,
        currentUser.id
      );
      if (isMounted) setRemoteHasSentThanks(hasThanks);
    }

    void checkCommunityThanks();
    return () => {
      isMounted = false;
    };
  }, [assignedWakeVoice, currentUser]);

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
  const hasSentThanks =
    remoteHasSentThanks ||
    thanksMessages.some(
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
      !reaction ||
      isSendingRef.current ||
      !text.trim()
    ) return;

    isSendingRef.current = true;
    setIsSending(true);
    setError(null);
    try {
      if (!isPersonal) {
        await communityVoiceService.sendThanks(
          assignedWakeVoice.sourceVoiceId ?? assignedWakeVoice.id,
          currentUser.id
        );
      }
      const messages = await thanksService.send({
        senderId: currentUser.id,
        receiverId: isPersonal ? assignedWakeVoice.senderId : 'community',
        sourceVoiceMessageId: assignedWakeVoice.id,
        reaction,
        text,
      });
      addThanksMessages(messages);
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(
        () => undefined
      );
      router.replace(isPersonal ? '/friend/request' : '/(tabs)/connections');
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
        {isPersonal ? (
          <Avatar
            avatarId={sender?.avatarId ?? 'sky'}
            imageUri={sender?.profileImageUri}
            name={sender?.nickname ?? 'Takuma'}
            size={56}
          />
        ) : (
          <View style={styles.communityAvatar}>
            <Ionicons color={colors.indigo} name="people-outline" size={24} />
          </View>
        )}
        <View style={styles.recipientCopy}>
          <AppText variant="bodyMedium">
            {isPersonal ? `${sender?.nickname ?? '誰か'}さんへ` : 'オキタ！のみんなへ'}
          </AppText>
          <AppText variant="caption" tone="muted">
            {isPersonal ? '今朝届いた声へのありがとう' : 'みんなに向けた声へのリアクション'}
          </AppText>
        </View>
      </View>

      <View style={styles.section}>
        <AppText variant="sectionTitle">今朝の気持ち</AppText>
        <View style={styles.reactions}>
          {thanksReactionOptions.map((option) => (
            <ChoiceChip
              key={option}
              label={option}
              onPress={() => setReaction(option)}
              selected={reaction === option}
              selectedStyle="warm"
            />
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <View style={styles.labelRow}>
          <AppText variant="sectionTitle">メッセージ</AppText>
          <AppText variant="caption" tone="muted">
            {text.length}/{prototypeConfig.thanksTextMaxLength}
          </AppText>
        </View>
        <TextInput
          accessibilityLabel="ありがとうのメッセージ"
          maxLength={prototypeConfig.thanksTextMaxLength}
          multiline
          onChangeText={setText}
          placeholder="声のおかげで、落ち着いて起きられました。"
          placeholderTextColor={colors.textTertiary}
          selectionColor={colors.indigo}
          style={styles.input}
          textAlignVertical="top"
          value={text}
        />
      </View>

      {error ? (
        <AppText variant="secondary" style={styles.error}>
          {error}
        </AppText>
      ) : null}

      <View style={styles.footer}>
        <AppButton
          buttonColor={paperColors.orange}
          contentColor={paperColors.ink}
          disabled={!reaction || isSending || !text.trim()}
          icon="heart-outline"
          label={isSending ? '届けています…' : 'ありがとうを届ける'}
          onPress={() => void handleSend()}
          style={styles.primaryAction}
          testID="send-thanks"
          variant="warm"
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
    alignItems: 'flex-start',
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
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    ...shadows.paper,
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
  section: {
    padding: spacing.lg,
    borderWidth: 2,
    borderColor: paperColors.ink,
    borderRadius: 18,
    backgroundColor: paperColors.base,
    gap: spacing.md,
    ...shadows.paper,
  },
  reactions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  input: {
    minHeight: 128,
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
