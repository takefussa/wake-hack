import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/common/app-text';
import { Avatar } from '@/components/common/avatar';
import { Waveform } from '@/components/common/waveform';
import type { OnboardingSceneType } from '@/data/onboarding-pages';

type OnboardingSceneProps = {
  scene: OnboardingSceneType;
};

function NameTag({
  name,
  color,
}: {
  name: string;
  color: string;
}) {
  return (
    <View style={[styles.nameTag, { backgroundColor: color }]}>
      <AppText style={styles.nameTagText}>{name}</AppText>
    </View>
  );
}

function Person({
  avatarId,
  name,
  color,
  size = 62,
}: {
  avatarId: 'luna' | 'sky' | 'ember' | 'mint';
  name: string;
  color: string;
  size?: number;
}) {
  return (
    <View style={styles.person}>
      <View
        style={[
          styles.personCircle,
          {
            width: size + 16,
            height: size + 16,
            borderRadius: (size + 16) / 2,
          },
        ]}>
        <Avatar avatarId={avatarId} name={name} size={size} />
      </View>

      <NameTag name={name} color={color} />
    </View>
  );
}

export function OnboardingScene({ scene }: OnboardingSceneProps) {
  if (scene === 'receive') {
    return (
      <View style={styles.receiveStage}>
        <View style={styles.morningBlock}>
          <View style={styles.beigeTape}>
            <AppText style={styles.smallLabel}>明日の朝</AppText>
          </View>

          <AppText style={styles.bigTime}>07:00</AppText>

          <View style={styles.redUnderline} />
        </View>

        <View style={styles.voiceCardWrap}>
          <View style={styles.blueTape} />

          <Ionicons
            name="attach-outline"
            size={30}
            color="#81765E"
            style={styles.paperClip}
          />

          <View style={styles.voiceCard}>
            <View style={styles.initialAvatar}>
              <AppText style={styles.initialAvatarText}>T</AppText>
            </View>

            <View style={styles.voiceInfo}>
              <AppText style={styles.voiceName}>Takumaさんから</AppText>

              <View style={styles.voiceDivider} />

              <AppText style={styles.voiceDuration}>0:09</AppText>
            </View>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="音声を再生"
              style={({ pressed }) => [
                styles.playButton,
                pressed && styles.pressed,
              ]}>
              <Ionicons name="play" size={25} color="#30463E" />
            </Pressable>
          </View>
        </View>

        <View style={styles.receiveDoodle}>
          <View style={styles.doodleLineOne} />
          <View style={styles.doodleLineTwo} />
        </View>
        <Ionicons name="star-outline" size={16} color="#D5B24E" style={styles.receiveStar} />
        <Ionicons name="sparkles-outline" size={15} color="#78AFC5" style={styles.receiveSparkle} />
      </View>
    );
  }

  if (scene === 'give') {
    return (
      <View style={styles.giveStage}>
        <View style={styles.nightBlock}>
          <View style={styles.nightTape}>
            <AppText style={styles.nightLabel}>前日の夜</AppText>
          </View>
          <Ionicons name="star-outline" size={15} color="#D5B24E" style={styles.nightStar} />
        </View>

        <View style={styles.recordingFlow}>
          <View style={styles.recordCardWrap}>
            <View style={styles.pinkTape} />

            <View style={styles.recordCard}>
              <View style={styles.recordMic}>
                <Ionicons
                  name="mic-outline"
                  size={31}
                  color="#30463E"
                />
              </View>

              <AppText style={styles.recordTime}>00:10</AppText>

              <View style={styles.recordWave}>
                <Waveform
                  color="#77B4D1"
                  height={34}
                  levels={[8, 18, 11, 27, 14, 22, 9, 25, 13, 20, 7]}
                />
              </View>

              <View style={styles.speechBubble}>
                <AppText style={styles.speechText}>おはよう。発表頑張れ！</AppText>
                <View style={styles.speechTail} />
              </View>

              <AppText style={styles.recordingText}>
                録音中…
              </AppText>
            </View>
          </View>

          <Ionicons
            name="arrow-forward"
            size={34}
            color="#30463E"
            style={styles.sendArrow}
          />

          <View style={styles.receiver}>
            <View style={styles.receiverCircle}>
              <View style={styles.receiverAvatar}>
                <AppText style={styles.receiverInitial}>T</AppText>
              </View>
            </View>
            <NameTag name="Takumi" color="#DCE8C8" />

            <AppText numberOfLines={1} style={styles.receiverMemo}>
              「明日は発表。」
            </AppText>
            <Ionicons name="heart-outline" size={15} color="#CE796A" style={styles.receiverHeart} />
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.connectionStage}>
      <View style={styles.connectionMap}>
        <View style={styles.topPerson}>
          <Person
            avatarId="sky"
            name="Takuma"
            color="#BDD9E7"
            size={62}
          />
        </View>

        <View style={styles.leftPerson}>
          <Person
            avatarId="luna"
            name="あなた"
            color="#F1CFC9"
            size={60}
          />
        </View>

        <View style={styles.rightPerson}>
          <Person
            avatarId="mint"
            name="Haruka"
            color="#D9E7C5"
            size={60}
          />
        </View>

        <View style={styles.centerMic}>
          <Ionicons
            name="mic-outline"
            size={24}
            color="#30463E"
          />
        </View>

        <View style={styles.lineTopLeft} />
        <View style={styles.lineTopRight} />
        <View style={styles.lineBottom} />

        <Ionicons
          name="musical-note"
          size={21}
          color="#76AECA"
          style={styles.noteDoodle}
        />

        <Ionicons
          name="sunny-outline"
          size={24}
          color="#E0B44F"
          style={styles.sunDoodle}
        />

        <Ionicons
          name="sparkles-outline"
          size={20}
          color="#D6927D"
          style={styles.sparkleDoodle}
        />
      </View>

      <View style={styles.connectionMemo}>
        <AppText style={styles.connectionMemoText}>
          名前を知らなくても、
        </AppText>

        <AppText style={styles.connectionMemoText}>
          声の向こうに人がいる。
        </AppText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  pressed: {
    opacity: 0.65,
  },

  smallLabel: {
    color: '#30463E',
    fontSize: 15,
    letterSpacing: 2,
  },

  receiveStage: {
    position: 'relative',
    marginTop: 14,
    minHeight: 390,
    justifyContent: 'center',
  },

  morningBlock: {
    marginLeft: 32,
    alignItems: 'flex-start',
  },

  beigeTape: {
    paddingHorizontal: 16,
    paddingVertical: 7,
    backgroundColor: 'rgba(224, 213, 185, 0.88)',
    transform: [{ rotate: '-3deg' }],
  },

  bigTime: {
    marginTop: 12,
    color: '#30463E',
    fontSize: 72,
    lineHeight: 80,
    letterSpacing: 2,
  },

  redUnderline: {
    marginTop: 1,
    marginLeft: -8,
    width: 245,
    height: 6,
    borderRadius: 8,
    backgroundColor: 'rgba(243, 196, 197, 0.88)',
    transform: [{ rotate: '-2deg' }],
  },

  voiceCardWrap: {
    marginTop: 38,
    position: 'relative',
  },

  blueTape: {
    position: 'absolute',
    top: -12,
    left: 6,
    width: 70,
    height: 24,
    zIndex: 5,
    backgroundColor: 'rgba(174, 203, 226, 0.88)',
    transform: [{ rotate: '-13deg' }],
  },

  paperClip: {
    position: 'absolute',
    top: -18,
    right: 14,
    zIndex: 6,
    transform: [{ rotate: '18deg' }],
  },

  voiceCard: {
    minHeight: 134,
    paddingHorizontal: 20,
    paddingVertical: 22,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    backgroundColor: 'rgba(255, 253, 248, 0.96)',
    borderWidth: 1.2,
    borderColor: '#899087',
    borderRadius: 10,
    shadowColor: '#716A5C',
    shadowOpacity: 0.12,
    shadowRadius: 3,
    shadowOffset: {
      width: 2,
      height: 3,
    },
    elevation: 2,
    transform: [{ rotate: '0.3deg' }],
  },

  initialAvatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#AECBE2',
    borderWidth: 1,
    borderColor: '#578CA7',
  },

  initialAvatarText: {
    color: '#FFFFFF',
    fontSize: 20,
  },

  voiceInfo: {
    flex: 1,
  },

  voiceName: {
    color: '#30463E',
    fontSize: 16,
  },

  voiceDivider: {
    marginVertical: 10,
    width: '86%',
    borderBottomWidth: 1,
    borderBottomColor: '#969B91',
    borderStyle: 'dashed',
  },

  voiceDuration: {
    color: '#56615B',
    fontSize: 14,
  },

  playButton: {
    width: 58,
    height: 58,
    borderRadius: 29,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFDF8',
    borderWidth: 1.2,
    borderColor: '#738078',
  },

  receiveDoodle: {
    position: 'absolute',
    right: 14,
    bottom: 0,
  },

  receiveStar: {
    position: 'absolute',
    top: 48,
    right: 36,
    transform: [{ rotate: '9deg' }],
  },

  receiveSparkle: {
    position: 'absolute',
    left: 9,
    bottom: 18,
    transform: [{ rotate: '-10deg' }],
  },

  doodleLineOne: {
    width: 4,
    height: 17,
    borderRadius: 3,
    backgroundColor: '#F3C4C5',
    transform: [{ rotate: '14deg' }],
  },

  doodleLineTwo: {
    width: 4,
    height: 13,
    marginTop: -5,
    marginLeft: 16,
    borderRadius: 3,
    backgroundColor: '#F3C4C5',
    transform: [{ rotate: '44deg' }],
  },

  giveStage: {
    marginTop: 12,
    minHeight: 445,
  },

  nightBlock: {
    position: 'relative',
    marginTop: 40,
    marginLeft: 32,
    alignItems: 'flex-start',
  },

  nightTape: {
    paddingHorizontal: 28,
    paddingVertical: 13,
    backgroundColor: 'rgba(220, 238, 251, 0.86)',
  },

  nightLabel: {
    color: '#30463E',
    fontSize: 30,
    lineHeight: 39,
    letterSpacing: 2,
  },

  nightStar: {
    position: 'absolute',
    left: 202,
    bottom: -4,
    transform: [{ rotate: '8deg' }],
  },

  nightTime: {
    marginTop: 11,
    color: '#30463E',
    fontSize: 54,
    lineHeight: 62,
    letterSpacing: 2,
  },

  blueUnderline: {
    width: 170,
    height: 5,
    marginTop: 2,
    backgroundColor: 'rgba(174, 203, 226, 0.82)',
    borderRadius: 8,
    transform: [{ rotate: '-3deg' }],
  },

  recordingFlow: {
    marginTop: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },

  recordCardWrap: {
    flex: 1,
    position: 'relative',
  },

  pinkTape: {
    position: 'absolute',
    top: -12,
    left: '26%',
    width: 78,
    height: 24,
    zIndex: 4,
    backgroundColor: 'rgba(243, 196, 197, 0.88)',
    transform: [{ rotate: '2deg' }],
  },

  recordCard: {
    minHeight: 300,
    paddingHorizontal: 12,
    paddingTop: 32,
    paddingBottom: 16,
    alignItems: 'center',
    backgroundColor: 'rgba(255, 253, 248, 0.96)',
    borderWidth: 1.2,
    borderColor: '#7F8B84',
    borderRadius: 8,
    transform: [{ rotate: '-0.5deg' }],
  },

  recordMic: {
    width: 78,
    height: 78,
    borderRadius: 39,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E0D5B9',
    borderWidth: 1,
    borderColor: '#8E7E59',
  },

  recordTime: {
    marginTop: 10,
    color: '#30463E',
    fontSize: 17,
  },

  recordWave: {
    marginTop: 8,
    width: '100%',
    alignItems: 'center',
  },

  recordingText: {
    marginTop: 14,
    color: '#30463E',
    fontSize: 16,
  },

  speechBubble: {
    position: 'relative',
    width: '100%',
    minHeight: 46,
    marginTop: 10,
    paddingHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(243, 239, 228, 0.96)',
    borderWidth: 1,
    borderColor: '#C6B98E',
    borderRadius: 9,
  },

  speechTail: {
    position: 'absolute',
    right: 22,
    bottom: -7,
    width: 14,
    height: 14,
    backgroundColor: '#F3EFE4',
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#C6B98E',
    transform: [{ rotate: '45deg' }],
  },

  speechText: {
    color: '#30463E',
    fontSize: 13,
    lineHeight: 18,
  },

  sendArrow: {
    marginHorizontal: 8,
    transform: [{ rotate: '-2deg' }],
  },

  receiver: {
    width: 116,
    alignItems: 'center',
  },

  receiverCircle: {
    width: 80,
    height: 80,
    padding: 8,
    borderWidth: 1.2,
    borderColor: '#738078',
    borderRadius: 40,
    backgroundColor: 'rgba(255, 253, 248, 0.94)',
  },

  receiverAvatar: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 32,
    backgroundColor: '#F3C4C5',
  },

  receiverInitial: {
    color: '#8A5047',
    fontSize: 30,
  },

  receiverMemo: {
    marginTop: 12,
    color: '#30463E',
    fontSize: 12,
    lineHeight: 20,
    textAlign: 'center',
  },

  receiverHeart: {
    marginTop: 7,
    transform: [{ rotate: '-8deg' }],
  },

  person: {
    alignItems: 'center',
    zIndex: 4,
  },

  personCircle: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 253, 248, 0.94)',
    borderWidth: 1.2,
    borderColor: '#738078',
  },

  nameTag: {
    marginTop: 5,
    paddingHorizontal: 12,
    paddingVertical: 4,
    transform: [{ rotate: '-2deg' }],
  },

  nameTagText: {
    color: '#30463E',
    fontSize: 13,
  },

  connectionStage: {
    marginTop: 16,
    minHeight: 410,
    justifyContent: 'center',
  },

  connectionMap: {
    height: 290,
    position: 'relative',
  },

  topPerson: {
    position: 'absolute',
    top: 0,
    left: '50%',
    marginLeft: -44,
    zIndex: 5,
  },

  leftPerson: {
    position: 'absolute',
    left: 16,
    bottom: 8,
    zIndex: 5,
  },

  rightPerson: {
    position: 'absolute',
    right: 16,
    bottom: 8,
    zIndex: 5,
  },

  centerMic: {
    position: 'absolute',
    left: '50%',
    bottom: 74,
    marginLeft: -27,
    width: 54,
    height: 54,
    borderRadius: 27,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 5,
    backgroundColor: '#E0D5B9',
    borderWidth: 1,
    borderColor: '#847858',
  },

  lineTopLeft: {
    position: 'absolute',
    top: 126,
    left: 58,
    width: 150,
    borderTopWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: '#52685F',
    transform: [{ rotate: '-50deg' }],
  },

  lineTopRight: {
    position: 'absolute',
    top: 126,
    right: 58,
    width: 150,
    borderTopWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: '#52685F',
    transform: [{ rotate: '50deg' }],
  },

  lineBottom: {
    position: 'absolute',
    left: 105,
    right: 105,
    bottom: 44,
    borderTopWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: '#52685F',
  },

  sunDoodle: {
    position: 'absolute',
    left: 27,
    top: 30,
  },

  noteDoodle: {
    position: 'absolute',
    right: 24,
    top: 42,
    transform: [{ rotate: '10deg' }],
  },

  sparkleDoodle: {
    position: 'absolute',
    left: '49%',
    bottom: 8,
  },

  connectionMemo: {
    alignItems: 'center',
    marginTop: 14,
    marginHorizontal: 42,
    paddingHorizontal: 18,
    paddingVertical: 11,
    backgroundColor: 'rgba(224, 213, 185, 0.62)',
    transform: [{ rotate: '-0.5deg' }],
  },

  connectionMemoText: {
    color: '#30463E',
    fontSize: 17,
    lineHeight: 27,
    textAlign: 'center',
  },
});
