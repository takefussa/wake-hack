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

export const boombox = {
  body: '#565C64',
  bodyLight: '#666D76',
  bodyDark: '#3E434A',
  bodyDarkest: '#2C3036',
  deck: '#33373D',
  grille: '#484D54',
  grilleLine: '#63696F',
  screenBorder: '#20242A',
  cassetteWindow: '#EDEFF1',
  reel: '#B9BFC6',
  buttonPrimary: '#E7A199',
  buttonPrimaryPressed: '#D98A81',
  buttonSecondary: '#AECBE8',
  buttonSecondaryPressed: '#93B4D6',
  rec: '#E24A3F',
  recIdle: '#5A5F66',
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
  screenTitle: { fontSize: 28, lineHeight: 35, fontWeight: '700' as const },
  sectionTitle: { fontSize: 18, lineHeight: 24, fontWeight: '600' as const },
  body: { fontSize: 16, lineHeight: 24, fontWeight: '400' as const },
  bodyMedium: { fontSize: 16, lineHeight: 24, fontWeight: '600' as const },
  secondary: { fontSize: 14, lineHeight: 21, fontWeight: '400' as const },
  caption: { fontSize: 12, lineHeight: 17, fontWeight: '500' as const },
  displayNumber: { fontSize: 40, lineHeight: 48, fontWeight: '600' as const },
  time: { fontSize: 56, lineHeight: 62, fontWeight: '600' as const },
} as const;

export const fonts = Platform.select({
  ios: {
    sans: 'system-ui',
    rounded: 'ui-rounded',
  },
  default: {
    sans: 'sans-serif',
    rounded: 'sans-serif',
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', sans-serif",
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
