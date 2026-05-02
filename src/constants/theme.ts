export const Colors = {
  inkDim: '#5C5A52',
  inkFaint: '#8E8B81',
  inkHair: 'rgba(26,26,23,0.08)',
  inkHairStrong: 'rgba(26,26,23,0.14)',
  primaryDeep: '#1F4634',
  primarySoft: '#E8EFE9',
  primaryTint: '#D8E4DA',
  amberSoft: '#F4ECD8',
  amberTint: '#E8D9B4',
  primary: '#2A5C45',
  primaryLight: '#E8F2ED',
  primaryBorder: '#C8E2D5',
  amber: '#9C6B1A',
  amberLight: '#FDF3E3',
  amberDark: '#8B6914',
  sinBg: '#FAF5EE',
  sinBorder: '#E8DDD0',
  sinText: '#5A4A38',
  sinTextLight: '#B8A898',
  sinIconMuted: '#C4A882',
  sinIconBg: '#DDD5C8',
  sinCategoryText: '#7A6654',
  sinIconColor: '#AAA',
  sinLabelText: '#7A6654',
  contextWinText: '#3A7A60',
  contextSinBg: '#EDE0CE',
  contextSinText: '#A08060',
  appBg: '#F7F6F3',
  cardBg: '#FFFFFF',
  border: '#F0EEE9',
  inputBorder: '#E4E0DA',
  textPrimary: '#1A1A1A',
  textSecondary: '#555555',
  textMuted: '#AAAAAA',
  textHint: '#C4C0BB',
  white: '#FFFFFF',
  streakEmpty: '#EBEBEB',
  streakToday: '#CCCCCC',
  success: '#34C759',
  black: '#000000',
  tabInactive: '#C8C4BE',
  googleBlue: '#4285F4',
  googleGreen: '#34A853',
  googleYellow: '#FBBC05',
  googleRed: '#EA4335',
  overlay: 'rgba(0, 0, 0, 0.3)',
  transparent: 'transparent',
}

export const Fonts = {
  serifMedium: 'Fraunces_600SemiBold',
  serif: 'Fraunces_400Regular',
  serifSemiBold: 'Fraunces_600SemiBold',
  sans: 'DMSans_400Regular',
  sansMedium: 'DMSans_500Medium',
}

export const FontSizes = {
  xs: 10,
  sm: 11,
  base: 13,
  md: 15,
  lg: 17,
  xl: 21,
  xxl: 24,
  hero: 30,
  stat: 26,
}

export const Spacing = {
  hairline: 0.5,
  xxs: 2,
  xs: 4,
  xsMd: 6,
  sm: 8,
  smLg: 10,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 48,
  screen: 22,
  tabPaddingVertical: 7,
}

export const Sizes = {
  tabBarHeight: 56,
  headerHeight: 52,
  buttonHeight: 52,
  iconSm: 18,
  icon: 22,
  avatar: 72,
  chartHeight: 80,
  categoryNameWidth: 72,
  categoryTotalWidth: 28,
  dotSize: 8,
  categoryTrackHeight: 8,
}

export const BorderWidths = {
  sm: 1,
  md: 1.5,
  lg: 2,
}

export const Radius = {
  xs: 2,
  sm: 8,
  md: 12,
  lg: 14,
  xl: 20,
  xxl: 22,
  pill: 20,
  full: 9999,
}

export const LetterSpacing = {
  cardLabel: 0.8,
}

export const Icons = {
  defaultSize: 22,
  defaultColor: 'currentColor' as const,
}

export const DEFAULT_CATEGORIES = [
  'coding',
  'writing',
  'planning',
  'research',
  'other',
] as const

export type Category = (typeof DEFAULT_CATEGORIES)[number] | (string & {})
