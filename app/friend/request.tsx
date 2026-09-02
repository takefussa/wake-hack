import Ionicons from '@expo/vector-icons/Ionicons';
import * as Haptics from 'expo-haptics';
import { Redirect, router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { AppButton } from '@/components/common/app-button';
import { AppText } from '@/components/common/app-text';
import { Avatar } from '@/components/common/avatar';
import { Screen } from '@/components/common/screen';
import { colors, radii, spacing } from '@/constants/theme';
import { isWakeContextValid } from '@/features/wake/is-wake-context-valid';
import { useVoiceSender } from '@/hooks/use-voice-sender';
import { friendshipService } from '@/services/friendship-service';
import { useAppStore } from '@/store/use-app-store';
import type { Friendship } from '@/types';

export default function FriendRequestScreen() {
  const currentUser = useAppStore((state) => state.currentUser);
  const currentMorningRequest = useAppStore((state) => state.currentMorningRequest);
  const assignedWakeVoice = useAppStore((state) => state.assignedWakeVoice);
  const wakeSession = useAppStore((state) => state.wakeSession);
  const thanksMessages = useAppStore((state) => state.thanksMessages);
  const friendships = useAppStore((state) => state.friendships);
  const upsertFriendship = useAppStore((state) => state.upsertFriendship);
  const sender = useVoiceSender(assignedWakeVoice);
  const existingFriendship = friendships.find(
    (friendship) =>
      assignedWakeVoice &&
      (((friendship.userAId === currentUser?.id || friendship.userAId === 'current-user') &&
        friendship.userBId === assignedWakeVoice.senderId) ||
        (friendship.userAId === assignedWakeVoice.senderId &&
          (friendship.userBId === currentUser?.id ||
            friendship.userBId === 'current-user')))
  );
  const [friendship, setFriendship] = useState<Friendship | null>(
    existingFriendship ?? null
  );
  const [isMatching, setIsMatching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isMatchingRef = useRef(false);

  const restoreFriendship = useCallback(async () => {
    if (!currentUser || !assignedWakeVoice || assignedWakeVoice.type !== 'personal') {
      return;
    }
    const userId = currentUser.id;
    const senderId = assignedWakeVoice.senderId;
    setError(null);

    try {
      const restored = await friendshipService.getBetween(
        userId,
        senderId,
        friendships
      );
      if (restored) {
        upsertFriendship(restored);
        setFriendship(restored);
      }
    } catch {
      setError('オキメイトの状態を確認できませんでした。');
    }
  }, [assignedWakeVoice, currentUser, friendships, upsertFriendship]);

  useEffect(() => {
    void restoreFriendship();
  }, [restoreFriendship]);

  if (!currentUser || !currentMorningRequest || !assignedWakeVoice || !wakeSession) {
    return <Redirect href="/(tabs)" />;
  }
  if (
    !isWakeContextValid({
      currentUser,
      morningRequest: currentMorningRequest,
      voice: assignedWakeVoice,
      wakeSession,
    })
  ) {
    return <Redirect href="/(tabs)" />;
  }
  if (assignedWakeVoice.type !== 'personal') {
    return <Redirect href="/(tabs)/connections" />;
  }
  if (wakeSession.status !== 'completed') {
    return <Redirect href="/wake/alarm" />;
  }

  const hasSentThanks = thanksMessages.some(
    (message) =>
      message.senderId === currentUser.id &&
      message.sourceVoiceMessageId === assignedWakeVoice.id
  );
  if (!hasSentThanks) {
    return <Redirect href="/wake/thanks" />;
  }

  if (friendship) {
    return (
      <Redirect
        href={friendship.status === 'matched' ? '/(tabs)/friends' : '/(tabs)'}
      />
    );
  }

  async function handleRequest() {
    if (!currentUser || !assignedWakeVoice || friendship || isMatchingRef.current) return;

    isMatchingRef.current = true;
    setIsMatching(true);
    setError(null);
    try {
      const pending = await friendshipService.request(
        currentUser.id,
        assignedWakeVoice.senderId,
        assignedWakeVoice.id
      );
      upsertFriendship(pending);

      const resolved = await friendshipService.resolveDemoMatch(pending);
      upsertFriendship(resolved);
      if (resolved.status === 'matched') {
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(
          () => undefined
        );
      }
      router.replace(resolved.status === 'matched' ? '/(tabs)/friends' : '/(tabs)');
    } catch {
      setError('気持ちを届けられませんでした。もう一度お試しください。');
    } finally {
      isMatchingRef.current = false;
      setIsMatching(false);
    }
  }

  return (
    <Screen contentStyle={styles.content} testID="friend-request-screen">
      <StatusBar style="dark" />

      <View style={styles.hero}>
        <View style={styles.people}>
          <Avatar
            avatarId={currentUser.avatarId}
            imageUri={currentUser.profileImageUri}
            name={currentUser.nickname}
            size={68}
          />
          <View style={styles.connectionLine}>
            <Ionicons color={colors.indigo} name="volume-medium-outline" size={20} />
          </View>
          <Avatar
            avatarId={sender?.avatarId ?? 'sky'}
            imageUri={sender?.profileImageUri}
            name={sender?.nickname ?? 'Takuma'}
            size={68}
          />
        </View>

        <View style={styles.copy}>
          <AppText variant="screenTitle" style={styles.centeredText}>
            {isMatching
              ? '気持ちを届けています'
              : `また${sender?.nickname ?? 'この人'}さんと朝を迎えたい？`}
          </AppText>
          <AppText variant="secondary" tone="soft" style={styles.centeredText}>
            {isMatching
              ? '希望を保存しています。'
              : '今朝の声がよかったと感じたときだけ、次の朝にもつながれます。'}
          </AppText>
        </View>

        {isMatching ? <ActivityIndicator color={colors.indigo} /> : null}
      </View>

      {error ? (
        <AppText variant="secondary" style={styles.error}>
          {error}
        </AppText>
      ) : null}

      <View style={styles.actions}>
        <AppButton
          disabled={isMatching}
          icon="heart-outline"
          label="また朝を迎えたい"
          onPress={() => void handleRequest()}
          testID="request-friend"
        />
        <AppButton
          disabled={isMatching}
          label="今回はここまで"
          onPress={() => router.replace('/(tabs)')}
          variant="text"
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    minHeight: '100%',
    justifyContent: 'space-between',
    gap: spacing.xxxl,
  },
  hero: {
    flex: 1,
    minHeight: 420,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xxl,
  },
  people: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
  },
  connectionLine: {
    width: 64,
    height: 32,
    borderRadius: radii.badge,
    backgroundColor: colors.indigoSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  copy: {
    maxWidth: 320,
    alignItems: 'center',
    gap: spacing.md,
  },
  centeredText: {
    textAlign: 'center',
  },
  actions: {
    gap: spacing.sm,
  },
  error: {
    color: colors.danger,
    textAlign: 'center',
  },
});
