import { Platform } from 'react-native';

export const colors = {
  background: '#F6F6F3',
  surface: '#FFFFFF',
  surfaceSubtle: '#F0F1ED',
  navy: '#172033',
  navyRaised: '#202A3E',
  indigo: '#4D628B',
  indigoPressed: '#3E5075',
  indigoSoft: '#E7EAF0',
  warm: '#D59B45',
  warmPressed: '#C58A35',
  warmSoft: '#F3E8D7',
  morningSky: '#E5EEF2',
  morningLight: '#FFF9EA',
  morningBlush: '#F6E8E5',
  text: '#1E2530',
  textSecondary: '#66707C',
  textTertiary: '#9299A2',
  textInverse: '#FCFCFA',
  textInverseSecondary: '#C7CED8',
  border: '#DDE0DC',
  separator: '#E7E9E5',
  success: '#4F7864',
  successSoft: '#E3ECE7',
  danger: '#A85454',
  overlay: 'rgba(16, 23, 38, 0.32)',
  transparent: 'transparent',
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 48,
} as const;

export const radii = {
  card: 8,
  button: 12,
  input: 10,
  chip: 8,
  badge: 999,
  avatar: 999,
} as const;

export const typography = {
  screenTitle: { fontSize: 28, lineHeight: 35 },
  sectionTitle: { fontSize: 18, lineHeight: 24 },
  body: { fontSize: 16, lineHeight: 24 },
  bodyMedium: { fontSize: 16, lineHeight: 24 },
  secondary: { fontSize: 14, lineHeight: 21 },
  caption: { fontSize: 12, lineHeight: 17 },
  displayNumber: { fontSize: 40, lineHeight: 48 },
  time: { fontSize: 56, lineHeight: 62 },
} as const;

export const fontFamilyName = 'Tegaki851';

export const fonts = Platform.select({
  web: {
    sans: `'${fontFamilyName}', sans-serif`,
    rounded: `'${fontFamilyName}', sans-serif`,
    handwritten: `'${fontFamilyName}', sans-serif`,
  },
  default: {
    sans: fontFamilyName,
    rounded: fontFamilyName,
    handwritten: fontFamilyName,
  },
});

export const shadows = {
  surface:
    Platform.select({
      web: { boxShadow: '0 1px 3px rgba(23, 32, 51, 0.08)' },
      default: {
        shadowColor: colors.navy,
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.06,
        shadowRadius: 3,
        elevation: 1,
      },
    }) ?? {},
} as const;

export const componentSizes = {
  touchTarget: 44,
  buttonHeight: 52,
  inputHeight: 52,
  tabIcon: 23,
  avatar: 48,
  avatarLarge: 72,
  voiceControl: 56,
  timeWheelItem: 52,
} as const;

export const layout = {
  screenPadding: spacing.xl,
  maxContentWidth: 520,
  sectionGap: spacing.xxl,
} as const;
