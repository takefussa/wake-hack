import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { Redirect, router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Platform,
  Pressable,
  ScrollView,
  StyleProp,
  StyleSheet,
  TextStyle,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppText } from '@/components/common/app-text';
import { NotebookWallpaper } from '@/components/common/notebook-wallpaper';
import { voiceStyleOptions } from '@/constants/options';
import { fontFamilyName, paperColors, shadows } from '@/constants/theme';
import { useTapLock } from '@/hooks/use-tap-lock';
import { isSupabaseUuid } from '@/lib/identifiers';
import { rankMorningRequests } from '@/services/matching-service';
import type { MorningRequestMatch } from '@/services/matching-service';
import { morningRequestService } from '@/services/morning-request-service';
import { profileService } from '@/services/profile-service';
import { voiceService } from '@/services/voice-service';
import { useAppStore } from '@/store/use-app-store';
import type { UserProfile, VoiceStyle } from '@/types';

type TimelineMode = 'personal' | 'community';

type RequestCandidate = MorningRequestMatch & {
  user: UserProfile;
};

type DeliveryStatusItem = {
  voiceId: string;
  recipient: UserProfile;
  alarmReceivedAt: string | null;
};

function isUserProfile(profile: UserProfile | null): profile is UserProfile {
  return profile !== null;
}

// cassette 画像比率(1080x800)から算出したカード1件分の高さの目安
const CASSETTE_ASPECT_RATIO = 1080 / 800;

// 希望する声のスタイルに合わせてカセットの色を出し分ける
const CASSETTE_IMAGE_BY_VOICE_STYLE: Record<VoiceStyle, number> = {
  そっと優しく: require('../../assets/images/cassette-icon-lightblue.png'),
  明るく元気に: require('../../assets/images/cassette-icon-lightgreen.png'),
  渇を入れて: require('../../assets/images/cassette-icon-red.png'),
  面白く愉快に: require('../../assets/images/cassette-icon-yellow.png'),
};
const CASSETTE_MARGIN_BOTTOM = 1;
// カセットが浮いて見えるよう、それぞれに薄い影をつける
const cassetteShadow =
  Platform.select({
    web: { boxShadow: '0 4px 10px rgba(23, 32, 51, 0.22)' },
    default: {
      shadowColor: '#172033',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.22,
      shadowRadius: 10,
      elevation: 6,
    },
  }) ?? {};
const PAGE_CONTENT_HORIZONTAL_PADDING = 24;
// カセットだけページ余白より少しはみ出させて大きく見せるための量
const CASSETTE_HORIZONTAL_BLEED = 12;
const PAGE_CONTENT_BASE_BOTTOM_PADDING = 120;
const CASSETTE_MIN_SCALE = 0.7;
const CASSETTE_MIN_OPACITY = 0.4;
// 焦点からこの割合(0〜1)までは等倍/不透明度を保ち、そこから先で端に向けて縮小・かすませる
const CASSETTE_SCALE_PLATEAU_RATIO = 0.3;
const CASSETTE_OPACITY_PLATEAU_RATIO = 0.6;

function VoiceOptionsPanel({ options }: { options: readonly string[] }) {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(anim, {
      toValue: 1,
      duration: 260,
      useNativeDriver: true,
    }).start();
  }, [anim]);

  return (
    <Animated.View
      style={[
        styles.voiceOptionsPanel,
        {
          opacity: anim,
          transform: [
            {
              translateY: anim.interpolate({
                inputRange: [0, 1],
                outputRange: [-16, 0],
              }),
            },
          ],
        },
      ]}
    >
      {options.map((option) => (
        <Pressable
          key={option}
          style={({ pressed }) => [
            styles.voiceOptionButton,
            pressed && styles.pressed,
          ]}
          onPress={() => router.push({ pathname: '/community/record', params: { voiceStyle: option } })}
        >
          <AppText style={styles.voiceOptionText}>{option}</AppText>

          <Ionicons name="chevron-forward" size={18} color="#30463E" />
        </Pressable>
      ))}
    </Animated.View>
  );
}

// カセットの下部ラベル。文字を分割・回転すると端の文字が切れるため、
// 1つのTextとして自動縮小し、常に1行全体を表示する。
function CurvedLabel({ text, style }: { text: string; style?: StyleProp<TextStyle> }) {
  return (
    <View style={styles.curvedLabelRow}>
      <AppText
        adjustsFontSizeToFit
        minimumFontScale={0.55}
        numberOfLines={1}
        style={[styles.curvedLabelText, style]}
      >
        {text}
      </AppText>
    </View>
  );
}

export default function ConnectionsScreen() {
  const currentUser = useAppStore((state) => state.currentUser);
  const currentMorningRequest = useAppStore((state) => state.currentMorningRequest);
  const replaceMorningRequest = useAppStore((state) => state.replaceMorningRequest);
  const givenVoiceMessages = useAppStore((state) => state.givenVoiceMessages);
  const { width, height } = useWindowDimensions();

  const horizontalRef = useRef<ScrollView>(null);
  const personalScrollViewRef = useRef<ScrollView>(null);
  const runOnce = useTapLock();

  const personalScrollY = useRef(new Animated.Value(0)).current;
  const [personalViewportTop, setPersonalViewportTop] = useState(0);
  const [personalViewportHeight, setPersonalViewportHeight] = useState(0);

  const cassetteWidth =
    width - (PAGE_CONTENT_HORIZONTAL_PADDING - CASSETTE_HORIZONTAL_BLEED) * 2;
  const cassetteHeight = cassetteWidth / CASSETTE_ASPECT_RATIO;
  const cassetteItemHeight = cassetteHeight + CASSETTE_MARGIN_BOTTOM;

  // ヘッダー・タブの下からタブバーの上までの表示領域ではなく、
  // スマホの画面(ディスプレイ)全体の中央をズームの焦点にする
  const screenCenterInViewport = height / 2 - personalViewportTop;

  // 一番上のカセットが上端に引っかかって中央(最大ズーム)まで来られない問題を防ぐため、
  // 1枚目が初期表示のまま画面中央に来るよう上部余白を確保する
  const personalContentTopPadding = Math.max(
    0,
    screenCenterInViewport - cassetteHeight / 2
  );
  // 同様に、一番下のカセットも中央まで来られるよう下部余白を確保する
  const personalContentBottomPadding =
    PAGE_CONTENT_BASE_BOTTOM_PADDING +
    Math.max(
      0,
      personalViewportHeight - cassetteItemHeight - personalContentTopPadding
    );

  function getCassetteFocusInputRange(index: number) {
    const cardCenter =
      personalContentTopPadding + index * cassetteItemHeight + cassetteHeight / 2;
    const focusScrollY = cardCenter - screenCenterInViewport;

    return [
      focusScrollY - cassetteItemHeight,
      focusScrollY,
      focusScrollY + cassetteItemHeight,
    ];
  }

  function getCassettePlateauInputRange(index: number, plateauRatio: number) {
    const [rangeStart, focusScrollY, rangeEnd] = getCassetteFocusInputRange(index);
    const plateauBefore =
      focusScrollY - (focusScrollY - rangeStart) * plateauRatio;
    const plateauAfter =
      focusScrollY + (rangeEnd - focusScrollY) * plateauRatio;

    return [rangeStart, plateauBefore, plateauAfter, rangeEnd];
  }

  function getCassetteScale(index: number) {
    return personalScrollY.interpolate({
      inputRange: getCassettePlateauInputRange(index, CASSETTE_SCALE_PLATEAU_RATIO),
      outputRange: [CASSETTE_MIN_SCALE, 1, 1, CASSETTE_MIN_SCALE],
      extrapolate: 'clamp',
    });
  }

  function getCassetteOpacity(index: number) {
    return personalScrollY.interpolate({
      inputRange: getCassettePlateauInputRange(index, CASSETTE_OPACITY_PLATEAU_RATIO),
      outputRange: [CASSETTE_MIN_OPACITY, 1, 1, CASSETTE_MIN_OPACITY],
      extrapolate: 'clamp',
    });
  }

  const [mode, setMode] = useState<TimelineMode>('personal');
  const [showVoiceOptions, setShowVoiceOptions] = useState(false);
  const [candidates, setCandidates] = useState<RequestCandidate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [deliveryItems, setDeliveryItems] = useState<DeliveryStatusItem[]>([]);

  const loadCandidates = useCallback(async () => {
    if (!currentUser || !currentMorningRequest) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const remoteCurrentRequest =
        await morningRequestService.ensureRemoteRequest(currentMorningRequest);
      if (remoteCurrentRequest.id !== currentMorningRequest.id) {
        replaceMorningRequest(remoteCurrentRequest);
        return;
      }

      const availableRequests = await morningRequestService.getAvailableRequests(
        currentUser.id,
        remoteCurrentRequest.id
      );
      const requests = availableRequests.filter(
        (request) =>
          request.voiceCount === 0 &&
          !givenVoiceMessages.some(
            (voice) => voice.morningRequestId === request.id
          )
      );
      const profiles = (
        await Promise.all(requests.map((request) => profileService.getProfile(request.userId)))
      ).filter(isUserProfile);
      const matches = rankMorningRequests(currentUser, remoteCurrentRequest, requests, profiles);

      setCandidates(
        matches.flatMap((match) => {
          const user = profiles.find((profile) => profile.id === match.request.userId);
          return user ? [{ ...match, user }] : [];
        })
      );
    } catch {
      setError('朝リクエストを読み込めませんでした。');
    } finally {
      setIsLoading(false);
    }
  }, [currentMorningRequest, currentUser, givenVoiceMessages, replaceMorningRequest]);

  useEffect(() => {
    void loadCandidates();
  }, [loadCandidates]);

  const loadDeliveryStatuses = useCallback(async () => {
    if (!currentUser) {
      setDeliveryItems([]);
      return;
    }

    const sentVoices = givenVoiceMessages
      .filter(
        (voice) =>
          voice.type === 'personal' &&
          voice.senderId === currentUser.id &&
          !!voice.receiverId &&
          isSupabaseUuid(voice.id)
      )
      .slice(-3)
      .reverse();

    const items = await Promise.all(
      sentVoices.map(async (voice): Promise<DeliveryStatusItem | null> => {
        const recipient = await profileService.getProfile(voice.receiverId!);
        let alarmReceivedAt = voice.alarmReceivedAt ?? null;
        try {
          alarmReceivedAt = await voiceService.getAlarmReceivedAt(voice.id);
        } catch {
          // A missing receipt migration or a temporary network failure means
          // the last known state remains "waiting".
        }
        return recipient
          ? { voiceId: voice.id, recipient, alarmReceivedAt }
          : null;
      })
    );
    setDeliveryItems(
      items.filter((item): item is DeliveryStatusItem => item !== null)
    );
  }, [currentUser, givenVoiceMessages]);

  useEffect(() => {
    void loadDeliveryStatuses().catch(() => {
      // The delivery receipt migration may not be installed yet or the device
      // may be offline. The timeline remains usable in either case.
    });
  }, [loadDeliveryStatuses]);

  if (!currentUser) {
    return <Redirect href="/onboarding" />;
  }

  function moveTo(nextMode: TimelineMode) {
    const page = nextMode === 'personal' ? 0 : 1;

    horizontalRef.current?.scrollTo({
      x: page * width,
      animated: true,
    });

    setMode(nextMode);
  }

  function handleSwipeEnd(
    event: NativeSyntheticEvent<NativeScrollEvent>
  ) {
    const x = event.nativeEvent.contentOffset.x;
    const page = Math.round(x / width);

    setMode(page === 0 ? 'personal' : 'community');
  }

  async function handleRefresh() {
    if (isRefreshing) return;
    setIsRefreshing(true);
    try {
      await Promise.all([
        loadCandidates(),
        loadDeliveryStatuses().catch(() => undefined),
      ]);
    } finally {
      setIsRefreshing(false);
    }
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />

      <NotebookWallpaper />

      {/* ヘッダー */}
      <View style={styles.header}>
        <View style={styles.headerCopy}>
          <AppText style={styles.title}>起こす</AppText>
          <AppText style={styles.subtitle}>
            声を届けると、朝は別の誰かの声が届きます。
          </AppText>
        </View>
        <Pressable
          accessibilityLabel="起こす画面を更新"
          accessibilityRole="button"
          disabled={isRefreshing}
          hitSlop={8}
          onPress={() => void handleRefresh()}
          style={({ pressed }) => [
            styles.refreshButton,
            pressed && styles.pressed,
          ]}
        >
          {isRefreshing ? (
            <ActivityIndicator color="#30463E" size="small" />
          ) : (
            <Ionicons color="#30463E" name="refresh" size={21} />
          )}
        </Pressable>
      </View>

      {/* Twitter風 上タブ */}
      <View style={styles.modeTabs}>
        <Pressable
          onPress={() => moveTo('personal')}
          style={styles.modeButton}
        >
          <AppText
            style={[
              styles.modeText,
              mode === 'personal' && styles.modeTextActive,
            ]}
          >
            ひとりを起こす
          </AppText>

          {mode === 'personal' ? (
            <View
              style={[
                styles.marker,
                styles.personalMarker,
              ]}
            />
          ) : null}
        </Pressable>

        <Pressable
          onPress={() => moveTo('community')}
          style={styles.modeButton}
        >
          <View style={styles.communityLabelRow}>
            <AppText
              style={[
                styles.modeText,
                mode === 'community' &&
                  styles.modeTextActive,
              ]}
            >
              みんなを起こす
            </AppText>

            <Ionicons
              name="megaphone-outline"
              size={15}
              color="#6B716C"
            />
          </View>

          {mode === 'community' ? (
            <View
              style={[
                styles.marker,
                styles.communityMarker,
              ]}
            />
          ) : null}
        </Pressable>
      </View>

      {/* 横スワイプ領域 */}
      <ScrollView
        ref={horizontalRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleSwipeEnd}
        keyboardShouldPersistTaps="handled"
      >
        {/* PERSONAL */}
        <View style={[styles.page, { width }]}>
          <Animated.ScrollView
            ref={personalScrollViewRef}
            onLayout={() => {
              (
                personalScrollViewRef.current as unknown as {
                  measureInWindow: (
                    callback: (x: number, y: number, w: number, h: number) => void
                  ) => void;
                } | null
              )?.measureInWindow((_x, y, _w, h) => {
                setPersonalViewportTop(y);
                setPersonalViewportHeight(h);
              });
            }}
            onScroll={Animated.event(
              [{ nativeEvent: { contentOffset: { y: personalScrollY } } }],
              { useNativeDriver: true }
            )}
            scrollEventThrottle={16}
            showsVerticalScrollIndicator={false}
          >
            <View
              style={[
                styles.pageContent,
                {
                  paddingTop: personalContentTopPadding,
                  paddingBottom: personalContentBottomPadding,
                },
              ]}
            >
            {!currentMorningRequest ? (
              <View style={styles.stateCard}>
                <AppText style={styles.stateTitle}>
                  明日の朝を設定すると表示されます
                </AppText>

                <AppText style={styles.stateText}>
                  起きる時間や気分を登録すると、声を届けられる相手がここに並びます。
                </AppText>

                <Pressable
                  style={({ pressed }) => [
                    styles.stateButton,
                    pressed && styles.pressed,
                  ]}
                  onPress={() =>
                    runOnce(() => router.push('/morning/setup'))
                  }
                >
                  <AppText style={styles.stateButtonText}>
                    明日の朝を設定する
                  </AppText>
                </Pressable>
              </View>
            ) : null}

            {currentMorningRequest && isLoading ? (
              <View style={styles.stateCard}>
                <ActivityIndicator color="#30463E" />

                <AppText style={styles.stateText}>
                  あなたに近い朝を探しています
                </AppText>
              </View>
            ) : null}

            {currentMorningRequest && !isLoading && error ? (
              <View style={styles.stateCard}>
                <AppText style={styles.stateTitle}>{error}</AppText>

                <Pressable
                  style={({ pressed }) => [
                    styles.stateButton,
                    pressed && styles.pressed,
                  ]}
                  onPress={() => void loadCandidates()}
                >
                  <AppText style={styles.stateButtonText}>
                    もう一度読み込む
                  </AppText>
                </Pressable>
              </View>
            ) : null}

            {currentMorningRequest &&
            !isLoading &&
            !error &&
            candidates.length === 0 ? (
              <View style={styles.stateCard}>
                <AppText style={styles.stateTitle}>
                  今は個別の朝リクエストがありません
                </AppText>

                <AppText style={styles.stateText}>
                  少し時間を置くか、今日はみんなに向けた声で朝を迎えられます。
                </AppText>
              </View>
            ) : null}

            {currentMorningRequest &&
              !isLoading &&
              !error &&
              candidates.map(({ request, user }, index) => (
                <Pressable
                  accessibilityLabel={`${user.nickname}さんを起こす`}
                  accessibilityRole="button"
                  key={request.id}
                  onPress={() =>
                    runOnce(() =>
                      router.push({
                        pathname: '/morning/request-detail',
                        params: { requestId: request.id },
                      })
                    )
                  }
                  style={({ pressed }) => [
                    styles.cassetteTouchable,
                    pressed && styles.pressed,
                  ]}
                >
                  <Animated.View
                    style={[
                      styles.cassette,
                      {
                        opacity: getCassetteOpacity(index),
                        transform: [
                          { rotate: index % 2 === 0 ? '-0.25deg' : '0.25deg' },
                          { scale: getCassetteScale(index) },
                        ],
                      },
                    ]}
                  >
                    <Image
                      accessibilityIgnoresInvertColors
                      contentFit="fill"
                      source={CASSETTE_IMAGE_BY_VOICE_STYLE[request.preferredVoiceStyle]}
                      style={StyleSheet.absoluteFill}
                    />

                    <View style={styles.cassetteNameOverlay}>
                      <AppText
                        adjustsFontSizeToFit
                        minimumFontScale={0.5}
                        numberOfLines={1}
                        style={styles.cassetteName}
                      >
                        {user.nickname}
                      </AppText>
                    </View>

                    <View style={styles.cassetteAttributeOverlay}>
                      <View pointerEvents="none" style={styles.cassetteAttributeTape} />
                      <AppText
                        adjustsFontSizeToFit
                        minimumFontScale={0.55}
                        numberOfLines={1}
                        style={styles.cassetteAttributeValue}
                      >
                        {user.userType}
                      </AppText>
                    </View>

                    <View style={styles.cassetteVoiceStyleOverlay}>
                      <CurvedLabel
                        style={styles.cassetteVoiceStyleValue}
                        text={request.preferredVoiceStyle}
                      />
                    </View>
                  </Animated.View>
                </Pressable>
              ))}

            {deliveryItems.length > 0 ? (
              <View style={styles.deliverySection}>
                <AppText style={styles.thanksTitle}>最近届けた声</AppText>
                <AppText style={styles.thanksDescription}>
                  相手のAlarmKitへ設定できたかを表示します。
                </AppText>
                <View style={styles.deliveryList}>
                  {deliveryItems.map((item) => (
                    <View key={item.voiceId} style={styles.deliveryRow}>
                      <Ionicons
                        color={item.alarmReceivedAt ? '#66835F' : '#9A765B'}
                        name={
                          item.alarmReceivedAt
                            ? 'checkmark-circle'
                            : 'time-outline'
                        }
                        size={20}
                      />
                      <AppText style={styles.deliveryText}>
                        {item.alarmReceivedAt
                          ? `${item.recipient.nickname}さんに届きました`
                          : `${item.recipient.nickname}さんの受け取り待ち`}
                      </AppText>
                    </View>
                  ))}
                </View>
              </View>
            ) : null}

            </View>
          </Animated.ScrollView>
        </View>

        {/* COMMUNITY */}
        <View style={[styles.page, { width }]}>
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.pageContent}
          >
            <View style={styles.communityHero}>
              <View style={styles.communityTape} />

              <Ionicons
                name="megaphone-outline"
                size={31}
                color="#30463E"
              />

              <AppText style={styles.communityTitle}>
                みんなの朝にも声を届ける
              </AppText>

              <AppText style={styles.communityDescription}>
                特定の誰かではなく、
                {'\n'}
                いろんな人の朝に届く声です。
              </AppText>

              <Pressable
                style={({ pressed }) => [
                  styles.communityRecordButton,
                  pressed && styles.pressed,
                ]}
                onPress={() => setShowVoiceOptions((prev) => !prev)}
              >
                <Ionicons
                  name="mic"
                  size={23}
                  color="#30463E"
                />

                <AppText style={styles.communityRecordText}>
                  コミュニティボイスを録る
                </AppText>
              </Pressable>

              {showVoiceOptions ? (
                <VoiceOptionsPanel options={voiceStyleOptions} />
              ) : null}
            </View>

            <View style={styles.communityHint}>
              <Ionicons
                name="heart"
                size={17}
                color={paperColors.ink}
              />

              <AppText style={styles.communityHintText}>
                いろんな人に届くから、
                {'\n'}
                いいねがたくさん集まることも。
              </AppText>
            </View>
          </ScrollView>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F6F6F6',
  },

  paperLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: 'rgba(174, 203, 226, 0.52)',
  },

  marginLine: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 44,
    width: 1,
    backgroundColor: 'rgba(243, 196, 197, 0.80)',
  },

  header: {
    paddingHorizontal: 28,
    paddingTop: 8,
    paddingBottom: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },

  headerCopy: {
    flex: 1,
  },

  refreshButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#D4C7B2',
    backgroundColor: '#FFFDF7',
    borderRadius: 10,
  },

  title: {
    fontFamily: fontFamilyName,
    color: '#30463E',
    fontSize: 29,
  },

  subtitle: {
    marginTop: 3,
    fontFamily: fontFamilyName,
    color: '#6B716C',
    fontSize: 13,
  },

  modeTabs: {
    height: 55,
    flexDirection: 'row',

    backgroundColor: '#FFFDF8',

    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: paperColors.ruleBlue,
  },

  modeButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',

    position: 'relative',
  },

  communityLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },

  modeText: {
    fontFamily: fontFamilyName,
    color: '#777B77',
    fontSize: 15,
  },

  modeTextActive: {
    fontFamily: fontFamilyName,
    color: '#30463E',
  },

  marker: {
    position: 'absolute',
    bottom: 5,
    width: 105,
    height: 6,
    opacity: 0.65,
    borderRadius: 5,
    transform: [{ rotate: '-1deg' }],
  },

  personalMarker: {
    backgroundColor: paperColors.ruleBlue,
  },

  communityMarker: {
    backgroundColor: paperColors.ruleBlue,
  },

  page: {
    flex: 1,
  },

  pageContent: {
    paddingHorizontal: 24,
    paddingTop: 20,

    // 下タブに隠れないようにする
    paddingBottom: 120,
  },

  stateCard: {
    minHeight: 220,

    marginHorizontal: 8,
    marginBottom: 18,

    paddingHorizontal: 20,
    paddingVertical: 24,

    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,

    backgroundColor: '#FFFDF8',

    borderWidth: 2,
    borderColor: paperColors.ink,
    ...shadows.paper,
  },

  stateTitle: {
    textAlign: 'center',

    fontFamily: fontFamilyName,
    color: '#30463E',
    fontSize: 16,
  },

  stateText: {
    textAlign: 'center',

    fontFamily: fontFamilyName,
    color: '#6B716C',
    fontSize: 13,
    lineHeight: 20,
  },

  stateButton: {
    marginTop: 8,

    paddingHorizontal: 22,
    paddingVertical: 12,

    backgroundColor: paperColors.salmon,

    borderWidth: 2,
    borderColor: paperColors.ink,
    ...shadows.paper,
  },

  stateButtonText: {
    fontFamily: fontFamilyName,
    color: '#30463E',
    fontSize: 14,
  },

  cassetteTouchable: {
    marginBottom: CASSETTE_MARGIN_BOTTOM,
    marginHorizontal: -CASSETTE_HORIZONTAL_BLEED,
    ...cassetteShadow,
  },

  thanksSection: {
    marginTop: 28,
    paddingHorizontal: 18,
    paddingVertical: 20,
    backgroundColor: '#FFFDF7',
    borderWidth: 1,
    borderColor: '#D4C7B2',
  },

  deliverySection: {
    marginTop: 28,
    paddingHorizontal: 18,
    paddingVertical: 20,
    backgroundColor: '#FFFDF7',
    borderWidth: 1,
    borderColor: '#A8BC91',
  },

  deliveryList: {
    marginTop: 12,
    gap: 9,
  },

  deliveryRow: {
    minHeight: 38,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    paddingHorizontal: 11,
    backgroundColor: '#F2F5E9',
  },

  deliveryText: {
    flex: 1,
    fontFamily: fontFamilyName,
    color: '#405348',
    fontSize: 13,
  },

  thanksHeading: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    gap: 12,
  },

  thanksTitle: {
    fontFamily: fontFamilyName,
    color: '#30463E',
    fontSize: 17,
  },

  thanksCount: {
    fontFamily: fontFamilyName,
    color: '#6B716C',
    fontSize: 12,
  },

  thanksDescription: {
    marginTop: 5,
    fontFamily: fontFamilyName,
    color: '#6B716C',
    fontSize: 12,
  },

  thanksError: {
    marginTop: 12,
    fontFamily: fontFamilyName,
    color: '#A65353',
    fontSize: 12,
  },

  thanksLoader: {
    marginTop: 20,
  },

  thanksEmpty: {
    marginTop: 18,
    fontFamily: fontFamilyName,
    color: '#777B77',
    fontSize: 13,
  },

  thanksList: {
    marginTop: 10,
  },

  cassette: {
    position: 'relative',

    width: '100%',
    aspectRatio: 1080 / 800,

    overflow: 'hidden',
  },

  // ラベル(白い部分)は画像内で概ね left 28.4% / top 26.1% / width 43.2% / height 33.6%
  // ラベル(白い部分)のうち、内側の帯より上の領域に名前を表示
  cassetteNameOverlay: {
    position: 'absolute',
    top: '26.1%',
    // ラベルの左右に余っている領域も使い、長い名前を1行で収める
    left: '22%',

    width: '56%',
    height: '24.4%',

    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },

  cassetteName: {
    width: '100%',
    maxWidth: '100%',
    flexShrink: 1,
    fontFamily: fontFamilyName,
    color: '#2E2E2E',
    fontSize: 20,
    textAlign: 'center',
  },

  // ラベル下部にある帯にちょうど収まる位置に属性を表示
  cassetteAttributeOverlay: {
    position: 'absolute',
    top: '50.6%',
    left: '22%',

    width: '56%',
    height: '9.1%',

    alignItems: 'center',
    justifyContent: 'center',
  },

  cassetteAttributeValue: {
    width: '100%',
    maxWidth: '100%',
    flexShrink: 1,
    fontFamily: fontFamilyName,
    color: '#2E2E2E',
    fontSize: 12,
    textAlign: 'center',
  },

  // 属性の文字の後ろに敷く、薄いピンクのセロハンテープ風の帯
  cassetteAttributeTape: {
    position: 'absolute',
    left: '8%',
    right: '8%',
    top: '18%',
    bottom: '18%',
    backgroundColor: 'rgba(243, 196, 197, 0.5)',
    borderRadius: 2,
  },

  // 下部中央の枠(持ち手部分)に希望する声のスタイルを表示
  cassetteVoiceStyleOverlay: {
    position: 'absolute',
    top: '67.25%',
    left: '24.35%',

    width: '51.3%',
    height: '18.6%',

    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },

  cassetteVoiceStyleValue: {
    fontFamily: fontFamilyName,
    color: '#2E2E2E',
    fontSize: 16,
    textAlign: 'center',
  },

  curvedLabelRow: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },

  curvedLabelText: {
    width: '100%',
    flexShrink: 1,
    textAlign: 'center',
  },

  pressed: {
    opacity: 0.68,
  },

  communityHero: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 20,

    alignItems: 'center',

    backgroundColor: '#FFFDF8',

    borderWidth: 2,
    borderColor: paperColors.ink,
    ...shadows.paper,
  },

  communityTape: {
    position: 'absolute',
    top: -9,

    width: 75,
    height: 20,

    backgroundColor: paperColors.tape,

    transform: [{ rotate: '-3deg' }],
  },

  communityTitle: {
    marginTop: 8,

    fontFamily: fontFamilyName,
    color: '#30463E',
    fontSize: 19,
  },

  communityDescription: {
    marginTop: 7,

    textAlign: 'center',

    fontFamily: fontFamilyName,
    color: '#6D736E',
    fontSize: 13,
    lineHeight: 20,
  },

  communityRecordButton: {
    marginTop: 17,

    width: '100%',
    minHeight: 60,

    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',

    gap: 10,

    backgroundColor: paperColors.salmon,

    borderWidth: 2,
    borderColor: paperColors.ink,
    ...shadows.paper,
  },

  communityRecordText: {
    fontFamily: fontFamilyName,
    color: '#30463E',
    fontSize: 15,
  },

  communityHint: {
    marginTop: 15,
    marginHorizontal: 9,

    paddingHorizontal: 15,
    paddingVertical: 10,

    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',

    gap: 7,

    backgroundColor: '#FFFDF8',

    borderWidth: 1,
    borderStyle: 'solid',
    borderColor: paperColors.ink,
  },

  communityHintText: {
    textAlign: 'center',

    fontFamily: fontFamilyName,
    color: '#766B66',
    fontSize: 12,
    lineHeight: 18,
  },

  voiceOptionsPanel: {
    marginTop: 12,

    width: '100%',
    gap: 8,
  },

  voiceOptionButton: {
    minHeight: 50,

    paddingHorizontal: 16,

    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',

    backgroundColor: paperColors.paleYellow,

    borderWidth: 1,
    borderColor: paperColors.ruleBlue,
  },

  voiceOptionText: {
    fontFamily: fontFamilyName,
    color: '#30463E',
    fontSize: 14,
  },
});
