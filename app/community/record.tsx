import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { File, Paths } from 'expo-file-system';
import { useRef, useState } from 'react';
import { Linking, StyleSheet } from 'react-native';

import { AppButton } from '@/components/common/app-button';
import { AppText } from '@/components/common/app-text';
import { Screen } from '@/components/common/screen';
import { ScreenHeader } from '@/components/common/screen-header';
import { VoiceRecorderPanel } from '@/components/voice/voice-recorder-panel';
import { prototypeConfig } from '@/constants/config';
import { spacing } from '@/constants/theme';
import { useVoiceRecorder } from '@/hooks/use-voice-recorder';
import { useAppStore } from '@/store/use-app-store';
import type { VoiceStyle } from '@/types';

export default function CommunityRecordScreen() {
  const params = useLocalSearchParams<{ voiceStyle?: string | string[] }>();
  const style = (Array.isArray(params.voiceStyle) ? params.voiceStyle[0] : params.voiceStyle) as VoiceStyle;
  const currentUser = useAppStore((state) => state.currentUser);
  const addCommunityVoice = useAppStore((state) => state.addCommunityVoice);
  const recorder = useVoiceRecorder();
  const [error, setError] = useState<string | null>(null);
  const sending = useRef(false);

  if (!currentUser) return <Redirect href="/onboarding" />;
  const user = currentUser;

  async function save() {
    if (!recorder.recording || recorder.recording.durationMs < prototypeConfig.recordingMinMs || sending.current) {
      setError('2秒以上録音してください。');
      return;
    }
    sending.current = true;
    let voiceUri = recorder.recording.uri;
    try {
      const source = new File(voiceUri);
      if (source.exists) {
        const destination = new File(Paths.document, `community-${Date.now()}-${user.id}.wav`);
        source.copy(destination);
        voiceUri = destination.uri;
      }
    } catch {
      // Keep the recorder URI if the device cannot copy the file.
    }
    addCommunityVoice({
      id: `community-${Date.now()}-${user.id}`,
      senderId: user.id,
      uri: voiceUri,
      durationMs: recorder.recording.durationMs,
      type: 'community',
      voiceStyle: style,
      createdAt: new Date().toISOString(),
    });
    router.replace('/(tabs)/connections');
  }

  return (
    <Screen contentStyle={styles.content}>
      <StatusBar style="dark" />
      <ScreenHeader
        onBack={() => void recorder.leaveRecording().then(() => router.back())}
        title="コミュニティボイスを録る"
        description={`${style || 'あなたらしい'}声で、みんなの朝へ届けます。`}
      />
      <VoiceRecorderPanel
        canAskPermissionAgain={recorder.canAskPermissionAgain}
        durationMs={recorder.durationMs}
        error={recorder.error}
        headingLabel="みんなの明日の朝へ"
        isBusy={recorder.isBusy}
        isPlaying={recorder.isPlaying}
        isPlaybackReady={recorder.isPlaybackReady}
        isRecording={recorder.isRecording}
        isRequestingPermission={recorder.isRequestingPermission}
        metering={recorder.metering}
        onOpenSettings={() => void Linking.openSettings()}
        onRequestPermission={() => void recorder.requestPermission()}
        onReset={recorder.resetRecording}
        onStart={() => void recorder.startRecording()}
        onStop={() => void recorder.stopRecording()}
        onTogglePlayback={() => void recorder.togglePlayback()}
        permissionState={recorder.permissionState}
        playbackProgress={recorder.playbackProgress}
        recording={recorder.recording}
      />
      {error ? <AppText variant="secondary" style={styles.error}>{error}</AppText> : null}
      <AppButton
        disabled={!recorder.recording || recorder.recording.durationMs < prototypeConfig.recordingMinMs}
        icon="paper-plane-outline"
        label="コミュニティへ届ける"
        onPress={() => void save()}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({ content: { gap: spacing.xxl }, error: { color: '#B6533D' } });
