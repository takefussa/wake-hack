import type { VoiceStyle, WakeStyle } from '@/types';

export type WakeStyleOption = {
  id: WakeStyle;
  label: string;
  description: string;
  icon: 'leaf-outline' | 'sunny-outline' | 'alarm-outline' | 'happy-outline';
};

export const wakeStyleOptions: WakeStyleOption[] = [
  {
    id: 'gentle',
    label: 'やさしく',
    description: '落ち着いた声で起こしてほしい人向け',
    icon: 'leaf-outline',
  },
  {
    id: 'cheerful',
    label: '元気に',
    description: '明るく元気な声で起こしてほしい人向け',
    icon: 'sunny-outline',
  },
  {
    id: 'strict',
    label: 'しっかり',
    description: '二度寝しないよう強めに起こしてほしい人向け',
    icon: 'alarm-outline',
  },
  {
    id: 'funny',
    label: 'おもしろく',
    description: '楽しい・面白い声で起こしてほしい人向け',
    icon: 'happy-outline',
  },
];

export function getWakeStyleOption(wakeStyle: WakeStyle): WakeStyleOption {
  return wakeStyleOptions.find((option) => option.id === wakeStyle) ?? wakeStyleOptions[0];
}

export function mapVoiceStyleToWakeStyle(voiceStyle: VoiceStyle): WakeStyle {
  if (voiceStyle === '明るく元気に') return 'cheerful';
  if (voiceStyle === '渇を入れて') return 'strict';
  if (voiceStyle === '面白く愉快に') return 'funny';
  return 'gentle';
}

export function isWakeStyle(value: string): value is WakeStyle {
  return wakeStyleOptions.some((option) => option.id === value);
}
