import type { AudioSource } from 'expo-audio';

import type { VoiceMessage } from '@/types';

const onboardingHumanVoice = require('../../assets/audio/onboarding-takuma.wav') as number;
const personalWakeVoice = require('../../assets/audio/takuma-wake.wav') as number;
const communityWakeVoice = require('../../assets/audio/community-wake.wav') as number;

function isPlayableUri(uri: string): boolean {
  return /^(file|content|https?|blob):/.test(uri);
}

export function resolveVoiceSource(voice: VoiceMessage): AudioSource {
  if (voice.id === 'onboarding-voice-takuma') {
    return onboardingHumanVoice;
  }
  if (voice.id.startsWith('personal-voice-takuma')) {
    return personalWakeVoice;
  }
  if (isPlayableUri(voice.uri)) {
    return { uri: voice.uri };
  }
  if (voice.type === 'community') {
    return communityWakeVoice;
  }
  return null;
}
