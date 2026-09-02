import Ionicons from '@expo/vector-icons/Ionicons';
import * as Haptics from 'expo-haptics';
import { Redirect, router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useRef, useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';

import { AppButton } from '@/components/common/app-button';
import { AppText } from '@/components/common/app-text';
import { Avatar } from '@/components/common/avatar';
import { ChoiceChip } from '@/components/common/choice-chip';
import { ScreenHeader } from '@/components/common/screen-header';
import { MorningScreen } from '@/components/wake/morning-screen';
import { prototypeConfig } from '@/constants/config';
import { thanksReactionOptions } from '@/constants/options';
import { colors, fonts, radii, spacing } from '@/constants/theme';
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
  const [reaction, setReaction] = useState<string | null>(null);
  const [text, setText] = useState('');
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
      !reaction ||
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
      <ScreenHeader
        description={
          isPersonal
            ? `${sender?.nickname ?? '声をくれた人'}さんへ、起きられたことを短く返します。`
            : '今朝の声を届けてくれたみんなへ、起きられたことを返します。'
        }
        onBack={() => goBackOrReplace('/wake/complete')}
        title="ありがとうを届ける"
      />

      <View style={styles.recipient}>
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

      <AppButton
        disabled={
          !reaction || isSending || !text.trim()
        }
        icon="heart-outline"
        label={isSending ? '届けています…' : 'ありがとうを届ける'}
        onPress={() => void handleSend()}
        testID="send-thanks"
      />
    </MorningScreen>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: spacing.xxl,
  },
  recipient: {
    paddingVertical: spacing.lg,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  communityAvatar: {
    width: 56,
    height: 56,
    borderRadius: radii.avatar,
    backgroundColor: colors.indigoSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  recipientCopy: {
    flex: 1,
    gap: spacing.xs,
  },
  section: {
    gap: spacing.lg,
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
    minHeight: 112,
    borderRadius: radii.input,
    borderWidth: 1,
    borderColor: colors.border,
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
});
