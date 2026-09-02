import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';

import { AppText } from '@/components/common/app-text';
import { ThanksInboxRow } from '@/components/thanks/thanks-inbox-row';
import { thanksService } from '@/services/thanks-service';
import type { ThanksInboxItem, ThanksMessage, VoiceMessage } from '@/types';

type ReceivedThanksSectionProps = {
  userId: string;
  localMessages: ThanksMessage[];
  givenVoices: VoiceMessage[];
  onMessagesLoaded: (messages: ThanksMessage[]) => void;
  preview?: boolean;
};

export function ReceivedThanksSection({
  userId,
  localMessages,
  givenVoices,
  onMessagesLoaded,
  preview = true,
}: ReceivedThanksSectionProps) {
  const [items, setItems] = useState<ThanksInboxItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const messages = await thanksService.getMessagesForUser(userId, localMessages);
      const inbox = await thanksService.getInboxItems(messages, givenVoices, userId);
      onMessagesLoaded(messages);
      setItems(inbox);
    } catch {
      const inbox = await thanksService.getInboxItems(localMessages, givenVoices, userId).catch(
        () => []
      );
      setItems(inbox);
    } finally {
      setIsLoading(false);
    }
  }, [givenVoices, localMessages, onMessagesLoaded, userId]);

  useEffect(() => {
    void load();
  }, [load]);

  if (!isLoading && items.length === 0) return null;
  const shownItems = preview ? items.slice(0, 1) : items;

  const openHistory = preview ? () => router.push('/thanks/history') : undefined;

  return (
    <View style={styles.section} testID="home-received-thanks">
      <Pressable
        accessibilityRole={preview ? 'button' : undefined}
        disabled={!preview}
        onPress={openHistory}
        style={styles.previewHeader}
      >
        <View style={styles.heading}>
          <AppText style={styles.title}>届いたありがとう</AppText>
          {items.length > 0 ? <AppText style={styles.count}>{items.length}件</AppText> : null}
        </View>
        <AppText style={styles.description}>あなたが届けた声への返事です。</AppText>
      </Pressable>
      {isLoading ? <ActivityIndicator color="#536052" /> : null}
      {shownItems.map((item) => <ThanksInboxRow item={item} key={item.message.id} />)}
      {preview && items.length > 1 ? (
        <Pressable accessibilityRole="button" onPress={openHistory}>
          <AppText style={styles.more}>過去のありがとうも見る →</AppText>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    padding: 18,
    borderWidth: 1.5,
    borderColor: '#8D9279',
    borderRadius: 14,
    backgroundColor: 'rgba(255, 251, 237, 0.94)',
    gap: 10,
  },
  previewHeader: { gap: 10 },
  heading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { color: '#35463D', fontSize: 18, lineHeight: 25 },
  count: { color: '#8B5948', fontSize: 12, lineHeight: 17 },
  description: { color: '#777969', fontSize: 11, lineHeight: 16 },
  more: { color: '#536052', fontSize: 11, lineHeight: 16, textAlign: 'right' },
});
