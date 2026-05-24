/** İTEO kurumsal renk paleti */
export const IteoColors = {
  yellow: '#FFC700',
  yellowDark: '#E6B300',
  yellowLight: '#FFF3CC',
  black: '#0A0A0A',
  blackSoft: '#1A1A1A',
  white: '#FFFFFF',
  gray100: '#F5F5F5',
  gray200: '#E5E5E5',
  gray500: '#737373',
  success: '#16A34A',
  error: '#DC2626',
} as const;

const tintColor = IteoColors.yellow;

export default {
  light: {
    text: IteoColors.black,
    textSecondary: IteoColors.gray500,
    background: IteoColors.white,
    backgroundSecondary: IteoColors.gray100,
    tint: tintColor,
    tabIconDefault: IteoColors.gray500,
    tabIconSelected: tintColor,
    card: IteoColors.white,
    border: IteoColors.gray200,
    headerBackground: IteoColors.black,
    headerText: IteoColors.white,
  },
  dark: {
    text: IteoColors.white,
    textSecondary: '#A3A3A3',
    background: IteoColors.black,
    backgroundSecondary: IteoColors.blackSoft,
    tint: tintColor,
    tabIconDefault: '#A3A3A3',
    tabIconSelected: tintColor,
    card: IteoColors.blackSoft,
    border: '#333333',
    headerBackground: IteoColors.blackSoft,
    headerText: IteoColors.white,
  },
};
