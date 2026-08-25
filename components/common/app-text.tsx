import type { TextProps, TextStyle } from 'react-native';
import { StyleSheet, Text } from 'react-native';

import { colors, fonts, typography } from '@/constants/theme';

type TextVariant = keyof typeof typography;
type TextTone = 'dark' | 'soft' | 'muted' | 'light' | 'lightMuted' | 'accent' | 'warm';

type AppTextProps = TextProps & {
  variant?: TextVariant;
  tone?: TextTone;
};

const toneColors: Record<TextTone, string> = {
  dark: colors.text,
  soft: colors.textSecondary,
  muted: colors.textTertiary,
  light: colors.textInverse,
  lightMuted: colors.textInverseSecondary,
  accent: colors.indigo,
  warm: colors.warm,
};

export function AppText({
  variant = 'body',
  tone = 'dark',
  style,
  ...props
}: AppTextProps) {
  return (
    <Text
      {...props}
      style={[
        styles.base,
        typography[variant] as TextStyle,
        { color: toneColors[tone] },
        style,
      ]}
    />
  );
}

const styles = StyleSheet.create({
  base: {
    fontFamily: fonts?.sans,
    letterSpacing: 0,
  },
});
