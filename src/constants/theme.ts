export const Colors = {
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
}

export const Fonts = {
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
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  screen: 22,
}

export const Radius = {
  sm: 8,
  md: 12,
  lg: 14,
  xl: 20,
  xxl: 22,
  pill: 20,
  full: 9999,
}

export const DEFAULT_CATEGORIES = [
  'coding',
  'writing',
  'planning',
  'research',
  'other',
] as const

export type Category = (typeof DEFAULT_CATEGORIES)[number] | (string & {})
