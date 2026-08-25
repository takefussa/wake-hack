import type { AudioSource } from 'expo-audio';

import type { VoiceMessage } from '@/types';

const onboardingYuiVoice = require('../../assets/audio/onboarding-yui.wav') as number;
const yuiWakeVoice = require('../../assets/audio/yui-wake.wav') as number;
const communityWakeVoice = require('../../assets/audio/community-wake.wav') as number;

function isPlayableUri(uri: string): boolean {
  return /^(file|content|https?|blob):/.test(uri);
}

export function resolveVoiceSource(voice: VoiceMessage): AudioSource {
  if (voice.id === 'onboarding-voice-yui') {
    return onboardingYuiVoice;
  }
  if (voice.id === 'personal-voice-yui') {
    return yuiWakeVoice;
  }
  if (voice.type === 'community') {
    return communityWakeVoice;
  }
  if (isPlayableUri(voice.uri)) {
    return { uri: voice.uri };
  }
  return null;
}
