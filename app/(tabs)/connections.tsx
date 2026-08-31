import { Ionicons } from '@expo/vector-icons';
import { Redirect, router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppText } from '@/components/common/app-text';
import { fontFamilyName } from '@/constants/theme';
import { useTapLock } from '@/hooks/use-tap-lock';
import { rankMorningRequests } from '@/services/matching-service';
import type { MorningRequestMatch } from '@/services/matching-service';
import { morningRequestService } from '@/services/morning-request-service';
import { profileService } from '@/services/profile-service';
import { useAppStore } from '@/store/use-app-store';
import type { UserProfile } from '@/types';

type TimelineMode = 'personal' | 'community';

type RequestCandidate = MorningRequestMatch & {
  user: UserProfile;
};

function isUserProfile(profile: UserProfile | null): profile is UserProfile {
  return profile !== null;
}

const communityDemo = [
  {
    id: '1',
    name: 'Takuma',
    text: '今日もぼちぼちいこう〜',
    likes: 128,
  },
  {
    id: '2',
    name: 'Haruka',
    text: '朝から頑張るみんな、おはよう！',
    likes: 84,
  },
];

export default function ConnectionsScreen() {
  const currentUser = useAppStore((state) => state.currentUser);
  const currentMorningRequest = useAppStore((state) => state.currentMorningRequest);
  const currentGiveReceiverIds = useAppStore((state) => state.currentGiveReceiverIds);
  const replaceMorningRequest = useAppStore((state) => state.replaceMorningRequest);
  const { width } = useWindowDimensions();

  const horizontalRef = useRef<ScrollView>(null);
  const runOnce = useTapLock();

  const [mode, setMode] = useState<TimelineMode>('personal');
  const [candidates, setCandidates] = useState<RequestCandidate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
        (request) => !currentGiveReceiverIds.includes(request.userId)
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
  }, [currentGiveReceiverIds, currentMorningRequest, currentUser, replaceMorningRequest]);

  useEffect(() => {
    void loadCandidates();
  }, [loadCandidates]);

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

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />

      {/* ノート背景 */}
      <View pointerEvents="none" style={StyleSheet.absoluteFill}>
        {Array.from({ length: 35 }).map((_, index) => (
          <View
            key={index}
            style={[
              styles.paperLine,
              {
                top: 28 + index * 32,
              },
            ]}
          />
        ))}

        <View style={styles.marginLine} />
      </View>

      {/* ヘッダー */}
      <View style={styles.header}>
        <View>
          <AppText style={styles.title}>起こす</AppText>
          <AppText style={styles.subtitle}>
            誰かの明日の朝に、声を届けよう。
          </AppText>
        </View>

        <View style={styles.headerDoodle}>
          <Ionicons
            name="mic-outline"
            size={27}
            color="#30463E"
          />
        </View>
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
            個人を起こす
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
              コミュニティ
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
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.pageContent}
          >
            <View style={styles.personalIntro}>
              <View style={styles.introTape} />

              <AppText style={styles.introTitle}>
                明日の朝を待っている人
              </AppText>

              <AppText style={styles.introText}>
                予定や気持ちを見て、その人だけに
                {'\n'}
                10秒の声を届けます。
              </AppText>
            </View>

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
              candidates.map(({ request, user, commonPoints }, index) => (
                <View
                  key={request.id}
                  style={[
                    styles.personCard,
                    index % 2 === 0
                      ? styles.cardRotateLeft
                      : styles.cardRotateRight,
                  ]}
                >
                  <View style={styles.cardTape} />

                  <View style={styles.personHeader}>
                    <View style={styles.avatar}>
                      <AppText style={styles.avatarText}>
                        {user.nickname.charAt(0)}
                      </AppText>
                    </View>

                    <View style={styles.personInfo}>
                      <AppText style={styles.personName}>
                        {user.nickname}
                      </AppText>

                      <View style={styles.personMeta}>
                        <AppText style={styles.personType}>
                          {user.userType}
                        </AppText>

                        <View style={styles.dot} />

                        <Ionicons
                          name="alarm-outline"
                          size={15}
                          color="#687169"
                        />

                        <AppText style={styles.wakeTime}>
                          {request.wakeAt}
                        </AppText>
                      </View>
                    </View>
                  </View>

                  <View style={styles.tomorrowNote}>
                    <AppText style={styles.noteLabel}>
                      明日のこと
                    </AppText>

                    <AppText style={styles.noteText}>
                      「{request.schedules.join('・')}」
                    </AppText>
                  </View>

                  {commonPoints.length > 0 ? (
                    <View style={styles.commonPoints}>
                      <AppText style={styles.noteLabel}>
                        あなたとの共通点
                      </AppText>

                      <AppText style={styles.commonPointsText}>
                        {commonPoints.join('・')}
                      </AppText>
                    </View>
                  ) : null}

                  <Pressable
                    style={({ pressed }) => [
                      styles.personalVoiceButton,
                      pressed && styles.pressed,
                    ]}
                    onPress={() =>
                      runOnce(() =>
                        router.push({
                          pathname: '/morning/request-detail',
                          params: { requestId: request.id },
                        })
                      )
                    }
                  >
                    <Ionicons
                      name="mic"
                      size={21}
                      color="#30463E"
                    />

                    <View style={styles.voiceButtonCopy}>
                      <AppText style={styles.voiceButtonText}>
                        {user.nickname}さんを起こす
                      </AppText>

                      <AppText style={styles.voiceButtonSubtext}>
                        この人だけに声を届ける
                      </AppText>
                    </View>

                    <Ionicons
                      name="chevron-forward"
                      size={21}
                      color="#30463E"
                    />
                  </Pressable>
                </View>
              ))}

            {currentMorningRequest &&
            !isLoading &&
            !error &&
            candidates.length > 0 ? (
              <View style={styles.bottomMessage}>
                <Ionicons
                  name="heart-outline"
                  size={18}
                  color="#D98E87"
                />

                <AppText style={styles.bottomMessageText}>
                  名前を呼んで、その人のための
                  {'\n'}
                  「おはよう」を届けよう。
                </AppText>
              </View>
            ) : null}
          </ScrollView>
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
                onPress={() => {
                  // TODO:
                  // コミュニティボイス録音画面へ遷移
                }}
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
            </View>

            <View style={styles.communityHint}>
              <Ionicons
                name="heart"
                size={17}
                color="#E58F91"
              />

              <AppText style={styles.communityHintText}>
                いろんな人に届くから、
                {'\n'}
                いいねがたくさん集まることも。
              </AppText>
            </View>

            <View style={styles.communitySectionHeading}>
              <AppText style={styles.communitySectionTitle}>
                みんなの声
              </AppText>

              <View style={styles.pinkUnderline} />
            </View>

            {communityDemo.map((voice) => (
              <View
                key={voice.id}
                style={styles.communityCard}
              >
                <View style={styles.communityUserRow}>
                  <View style={styles.smallAvatar}>
                    <AppText style={styles.smallAvatarText}>
                      {voice.name.charAt(0)}
                    </AppText>
                  </View>

                  <AppText style={styles.communityName}>
                    {voice.name}
                  </AppText>
                </View>

                <View style={styles.communityVoicePaper}>
                  <Pressable style={styles.playButton}>
                    <Ionicons
                      name="play"
                      size={19}
                      color="#30463E"
                    />
                  </Pressable>

                  <View style={styles.fakeWave}>
                    {[18, 28, 13, 34, 23, 38, 16, 30, 21].map(
                      (height, index) => (
                        <View
                          key={index}
                          style={[
                            styles.waveLine,
                            { height },
                          ]}
                        />
                      )
                    )}
                  </View>

                  <AppText style={styles.voiceDuration}>
                    0:10
                  </AppText>
                </View>

                <AppText style={styles.communityVoiceText}>
                  「{voice.text}」
                </AppText>

                <View style={styles.likeRow}>
                  <Ionicons
                    name="heart"
                    size={20}
                    color="#E58F91"
                  />

                  <AppText style={styles.likeNumber}>
                    {voice.likes}
                  </AppText>
                </View>
              </View>
            ))}
          </ScrollView>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F7F0DE',
  },

  paperLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: 'rgba(117, 163, 177, 0.14)',
  },

  marginLine: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 44,
    width: 1,
    backgroundColor: 'rgba(220, 126, 126, 0.30)',
  },

  header: {
    paddingHorizontal: 28,
    paddingTop: 8,
    paddingBottom: 14,

    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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

  headerDoodle: {
    width: 45,
    height: 45,
    borderRadius: 23,

    alignItems: 'center',
    justifyContent: 'center',

    backgroundColor: '#F3D6CF',
    transform: [{ rotate: '4deg' }],
  },

  modeTabs: {
    height: 55,
    flexDirection: 'row',

    backgroundColor: '#FFFFFF',

    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#E7DED1',
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
    backgroundColor: '#8FC7DE',
  },

  communityMarker: {
    backgroundColor: '#F1A7A5',
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

  personalIntro: {
    marginHorizontal: 8,
    marginBottom: 20,

    paddingHorizontal: 20,
    paddingVertical: 16,

    backgroundColor: '#FFFDF7',

    borderWidth: 1,
    borderColor: '#D4C7B2',

    transform: [{ rotate: '-0.5deg' }],
  },

  introTape: {
    position: 'absolute',
    top: -8,
    left: 18,

    width: 65,
    height: 18,

    backgroundColor: '#B5D8E6',
    opacity: 0.75,

    transform: [{ rotate: '-5deg' }],
  },

  introTitle: {
    fontFamily: fontFamilyName,
    color: '#30463E',
    fontSize: 18,
  },

  introText: {
    marginTop: 7,

    fontFamily: fontFamilyName,
    color: '#687169',
    fontSize: 13,
    lineHeight: 20,
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

    backgroundColor: '#FFFDF7',

    borderWidth: 1,
    borderColor: '#D4C7B2',
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

    backgroundColor: '#B9DAE8',

    borderWidth: 1,
    borderColor: '#7FB4C9',
  },

  stateButtonText: {
    fontFamily: fontFamilyName,
    color: '#30463E',
    fontSize: 14,
  },

  commonPoints: {
    marginTop: 12,
  },

  commonPointsText: {
    marginTop: 5,

    fontFamily: fontFamilyName,
    color: '#59645D',
    fontSize: 13,
    lineHeight: 19,
  },

  personCard: {
    marginBottom: 18,

    padding: 18,

    backgroundColor: '#FFFDF7',

    borderWidth: 1,
    borderColor: '#CDBFA8',

    shadowColor: '#665C4F',
    shadowOpacity: 0.06,
    shadowRadius: 4,
    shadowOffset: {
      width: 1,
      height: 2,
    },

    elevation: 1,
  },

  cardRotateLeft: {
    transform: [{ rotate: '-0.25deg' }],
  },

  cardRotateRight: {
    transform: [{ rotate: '0.25deg' }],
  },

  cardTape: {
    position: 'absolute',
    top: -9,
    right: 22,

    width: 55,
    height: 18,

    backgroundColor: '#F3B9AF',
    opacity: 0.68,

    transform: [{ rotate: '5deg' }],
  },

  personHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  avatar: {
    width: 49,
    height: 49,
    borderRadius: 25,

    alignItems: 'center',
    justifyContent: 'center',

    backgroundColor: '#DDE8CB',

    borderWidth: 1,
    borderColor: '#AEB99D',
  },

  avatarText: {
    fontFamily: fontFamilyName,
    color: '#30463E',
    fontSize: 19,
  },

  personInfo: {
    marginLeft: 12,
  },

  personName: {
    fontFamily: fontFamilyName,
    color: '#30463E',
    fontSize: 18,
  },

  personMeta: {
    marginTop: 4,

    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },

  personType: {
    fontFamily: fontFamilyName,
    color: '#717770',
    fontSize: 12,
  },

  dot: {
    width: 3,
    height: 3,
    borderRadius: 2,
    backgroundColor: '#969A95',
  },

  wakeTime: {
    fontFamily: fontFamilyName,
    color: '#59645D',
    fontSize: 12,
  },

  tomorrowNote: {
    marginTop: 15,

    padding: 13,

    backgroundColor: '#FAF1D5',

    borderLeftWidth: 3,
    borderLeftColor: '#E5C978',
  },

  noteLabel: {
    fontFamily: fontFamilyName,
    color: '#887548',
    fontSize: 11,
  },

  noteText: {
    marginTop: 5,

    fontFamily: fontFamilyName,
    color: '#30463E',
    fontSize: 15,
    lineHeight: 22,
  },

  personalVoiceButton: {
    marginTop: 15,

    minHeight: 64,

    paddingHorizontal: 15,

    flexDirection: 'row',
    alignItems: 'center',

    backgroundColor: '#B9DAE8',

    borderWidth: 1,
    borderColor: '#7FB4C9',
  },

  voiceButtonCopy: {
    flex: 1,
    marginLeft: 10,
  },

  voiceButtonText: {
    fontFamily: fontFamilyName,
    color: '#30463E',
    fontSize: 15,
  },

  voiceButtonSubtext: {
    marginTop: 2,

    fontFamily: fontFamilyName,
    color: '#68736D',
    fontSize: 10,
  },

  pressed: {
    opacity: 0.68,
  },

  bottomMessage: {
    marginTop: 4,

    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',

    gap: 8,
  },

  bottomMessageText: {
    textAlign: 'center',

    fontFamily: fontFamilyName,
    color: '#767A76',
    fontSize: 12,
    lineHeight: 19,
  },

  communityHero: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 20,

    alignItems: 'center',

    backgroundColor: '#FFFDF7',

    borderWidth: 1,
    borderColor: '#CDBFA8',
  },

  communityTape: {
    position: 'absolute',
    top: -9,

    width: 75,
    height: 20,

    backgroundColor: '#F0B4B2',
    opacity: 0.72,

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

    backgroundColor: '#F1C6C3',

    borderWidth: 1,
    borderColor: '#D99B98',
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

    backgroundColor: '#FFF8F3',

    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#E4AAA3',
  },

  communityHintText: {
    textAlign: 'center',

    fontFamily: fontFamilyName,
    color: '#766B66',
    fontSize: 12,
    lineHeight: 18,
  },

  communitySectionHeading: {
    alignSelf: 'flex-start',

    marginTop: 25,
    marginBottom: 12,
    marginLeft: 4,
  },

  communitySectionTitle: {
    fontFamily: fontFamilyName,
    color: '#30463E',
    fontSize: 19,
  },

  pinkUnderline: {
    width: 90,
    height: 5,

    marginTop: -2,

    backgroundColor: '#F0AAA5',
    opacity: 0.65,

    transform: [{ rotate: '-2deg' }],
  },

  communityCard: {
    marginBottom: 15,

    padding: 16,

    backgroundColor: '#FFFDF7',

    borderWidth: 1,
    borderColor: '#D0C2AE',
  },

  communityUserRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  smallAvatar: {
    width: 34,
    height: 34,
    borderRadius: 17,

    alignItems: 'center',
    justifyContent: 'center',

    backgroundColor: '#DDE8CB',
  },

  smallAvatarText: {
    fontFamily: fontFamilyName,
    color: '#30463E',
    fontSize: 13,
  },

  communityName: {
    marginLeft: 9,

    fontFamily: fontFamilyName,
    color: '#30463E',
    fontSize: 14,
  },

  communityVoicePaper: {
    marginTop: 12,

    minHeight: 61,

    flexDirection: 'row',
    alignItems: 'center',

    paddingHorizontal: 11,

    backgroundColor: '#F5EFE1',
  },

  playButton: {
    width: 39,
    height: 39,
    borderRadius: 20,

    alignItems: 'center',
    justifyContent: 'center',

    backgroundColor: '#B9DAE8',
  },

  fakeWave: {
    flex: 1,

    height: 42,

    marginHorizontal: 12,

    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },

  waveLine: {
    width: 3,
    borderRadius: 2,

    backgroundColor: '#7597A2',
  },

  voiceDuration: {
    fontFamily: fontFamilyName,
    color: '#66726C',
    fontSize: 11,
  },

  communityVoiceText: {
    marginTop: 10,

    fontFamily: fontFamilyName,
    color: '#30463E',
    fontSize: 14,
  },

  likeRow: {
    alignSelf: 'flex-end',

    marginTop: 8,

    flexDirection: 'row',
    alignItems: 'center',

    gap: 4,
  },

  likeNumber: {
    fontFamily: fontFamilyName,
    color: '#9A6D6D',
    fontSize: 12,
  },
});
