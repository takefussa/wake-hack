import { Ionicons } from '@expo/vector-icons';
import { Redirect } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useRef, useState } from 'react';
import {
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
import { useAppStore } from '@/store/use-app-store';

type TimelineMode = 'personal' | 'community';

const personalDemo = [
  {
    id: '1',
    name: 'Takumi',
    time: '07:00',
    detail: '明日は発表があります',
    type: '大学生',
  },
  {
    id: '2',
    name: 'Haruka',
    time: '06:30',
    detail: '朝からバイト。ちょっと憂うつです',
    type: '大学生',
  },
  {
    id: '3',
    name: 'Sora',
    time: '07:30',
    detail: '明日は大事な試験があります',
    type: '高校生',
  },
];

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
  const { width } = useWindowDimensions();

  const horizontalRef = useRef<ScrollView>(null);

  const [mode, setMode] = useState<TimelineMode>('personal');

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

            {personalDemo.map((person, index) => (
              <View
                key={person.id}
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
                      {person.name.charAt(0)}
                    </AppText>
                  </View>

                  <View style={styles.personInfo}>
                    <AppText style={styles.personName}>
                      {person.name}
                    </AppText>

                    <View style={styles.personMeta}>
                      <AppText style={styles.personType}>
                        {person.type}
                      </AppText>

                      <View style={styles.dot} />

                      <Ionicons
                        name="alarm-outline"
                        size={15}
                        color="#687169"
                      />

                      <AppText style={styles.wakeTime}>
                        {person.time}
                      </AppText>
                    </View>
                  </View>
                </View>

                <View style={styles.tomorrowNote}>
                  <AppText style={styles.noteLabel}>
                    明日のこと
                  </AppText>

                  <AppText style={styles.noteText}>
                    「{person.detail}」
                  </AppText>
                </View>

                <Pressable
                  style={({ pressed }) => [
                    styles.personalVoiceButton,
                    pressed && styles.pressed,
                  ]}
                  onPress={() => {
                    // TODO:
                    // パーソナルボイス録音画面へ遷移
                  }}
                >
                  <Ionicons
                    name="mic"
                    size={21}
                    color="#30463E"
                  />

                  <View style={styles.voiceButtonCopy}>
                    <AppText style={styles.voiceButtonText}>
                      {person.name}さんを起こす
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
    color: '#30463E',
    fontSize: 29,
    fontWeight: '900',
  },

  subtitle: {
    marginTop: 3,
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
    color: '#777B77',
    fontSize: 15,
    fontWeight: '600',
  },

  modeTextActive: {
    color: '#30463E',
    fontWeight: '900',
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
    color: '#30463E',
    fontSize: 18,
    fontWeight: '900',
  },

  introText: {
    marginTop: 7,

    color: '#687169',
    fontSize: 13,
    lineHeight: 20,
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
    color: '#30463E',
    fontSize: 19,
    fontWeight: '900',
  },

  personInfo: {
    marginLeft: 12,
  },

  personName: {
    color: '#30463E',
    fontSize: 18,
    fontWeight: '900',
  },

  personMeta: {
    marginTop: 4,

    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },

  personType: {
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
    color: '#59645D',
    fontSize: 12,
    fontWeight: '700',
  },

  tomorrowNote: {
    marginTop: 15,

    padding: 13,

    backgroundColor: '#FAF1D5',

    borderLeftWidth: 3,
    borderLeftColor: '#E5C978',
  },

  noteLabel: {
    color: '#887548',
    fontSize: 11,
    fontWeight: '800',
  },

  noteText: {
    marginTop: 5,

    color: '#30463E',
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '700',
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
    color: '#30463E',
    fontSize: 15,
    fontWeight: '900',
  },

  voiceButtonSubtext: {
    marginTop: 2,

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

    color: '#30463E',
    fontSize: 19,
    fontWeight: '900',
  },

  communityDescription: {
    marginTop: 7,

    textAlign: 'center',

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
    color: '#30463E',
    fontSize: 15,
    fontWeight: '900',
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
    color: '#30463E',
    fontSize: 19,
    fontWeight: '900',
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
    color: '#30463E',
    fontSize: 13,
    fontWeight: '900',
  },

  communityName: {
    marginLeft: 9,

    color: '#30463E',
    fontSize: 14,
    fontWeight: '800',
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
    color: '#66726C',
    fontSize: 11,
  },

  communityVoiceText: {
    marginTop: 10,

    color: '#30463E',
    fontSize: 14,
    fontWeight: '600',
  },

  likeRow: {
    alignSelf: 'flex-end',

    marginTop: 8,

    flexDirection: 'row',
    alignItems: 'center',

    gap: 4,
  },

  likeNumber: {
    color: '#9A6D6D',
    fontSize: 12,
    fontWeight: '700',
  },
});
