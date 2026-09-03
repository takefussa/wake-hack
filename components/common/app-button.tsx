import Ionicons from '@expo/vector-icons/Ionicons';
import type { ComponentProps } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/common/app-text';
import { colors, componentSizes, radii, spacing } from '@/constants/theme';

type ButtonVariant =
  | 'primary'
  | 'secondary'
  | 'text'
  | 'textOnDark'
  | 'warm'
  | 'inverted';

type AppButtonProps = {
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
  icon?: ComponentProps<typeof Ionicons>['name'];
  disabled?: boolean;
  compact?: boolean;
  testID?: string;
  buttonColor?: ViewStyle['backgroundColor'];
  legacy?: boolean;
  style?: StyleProp<ViewStyle>;
  contentColor?: string;
};

function getTextTone(variant: ButtonVariant): 'light' | 'lightMuted' | 'dark' | 'accent' {
  if (variant === 'primary') return 'light';
  if (variant === 'secondary' || variant === 'text') return 'accent';
  if (variant === 'textOnDark') return 'lightMuted';
  return 'dark';
}

export function AppButton({
  label,
  onPress,
  variant = 'primary',
  icon,
  disabled = false,
  compact = false,
  testID,
  buttonColor,
  legacy = false,
  style,
  contentColor,
}: AppButtonProps) {
  const textTone = !legacy && variant === 'primary' ? 'dark' : getTextTone(variant);
  const iconColor =
    contentColor ??
    (legacy && textTone === 'accent'
      ? '#4D628B'
      : textTone === 'light'
        ? colors.textInverse
        : textTone === 'lightMuted'
          ? colors.textInverseSecondary
          : textTone === 'accent'
            ? colors.indigo
            : colors.text);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      disabled={disabled}
      onPress={onPress}
      testID={testID}
      style={({ pressed }) => [
        styles.button,
        compact && styles.compact,
        variant === 'primary' && styles.primary,
        variant === 'secondary' && styles.secondary,
        variant === 'text' && styles.text,
        variant === 'textOnDark' && styles.text,
        variant === 'warm' && styles.warm,
        variant === 'inverted' && styles.inverted,
        legacy && variant === 'primary' && styles.legacyPrimary,
        legacy && variant === 'secondary' && styles.legacySecondary,
        legacy && variant === 'warm' && styles.legacyWarm,
        style,
        disabled && styles.disabled,
        pressed && !disabled && styles.pressed,
        buttonColor ? { backgroundColor: buttonColor } : null,
      ]}>
      <View style={styles.content}>
        <AppText
          adjustsFontSizeToFit
          minimumFontScale={0.85}
          numberOfLines={1}
          style={[
            styles.label,
            legacy && textTone === 'accent' && styles.legacyAccentLabel,
            contentColor ? { color: contentColor } : null,
          ]}
          tone={textTone}
          variant="bodyMedium">
          {label}
        </AppText>
        {icon ? <Ionicons name={icon} size={18} color={iconColor} /> : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: componentSizes.buttonHeight,
    paddingHorizontal: spacing.xl,
    borderRadius: radii.button,
    alignItems: 'center',
    justifyContent: 'center',
  },
  compact: {
    minHeight: componentSizes.touchTarget,
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.lg,
  },
  content: {
    maxWidth: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  label: {
    flexShrink: 1,
    textAlign: 'center',
  },
  primary: {
    borderWidth: 1,
    borderColor: '#D59A9C',
    backgroundColor: '#F3C4C5',
  },
  secondary: {
    borderWidth: 1,
    borderColor: colors.indigo,
    backgroundColor: colors.transparent,
  },
  text: {
    minHeight: componentSizes.touchTarget,
    backgroundColor: colors.transparent,
  },
  warm: {
    backgroundColor: colors.warm,
  },
  inverted: {
    backgroundColor: colors.textInverse,
  },
  disabled: {
    opacity: 0.38,
  },
  pressed: {
    opacity: 0.78,
  },
  legacyPrimary: {
    borderWidth: 0,
    backgroundColor: '#4D628B',
  },
  legacySecondary: {
    borderColor: '#4D628B',
  },
  legacyWarm: {
    borderWidth: 0,
    backgroundColor: '#D59B45',
  },
  legacyAccentLabel: {
    color: '#4D628B',
  },
});
