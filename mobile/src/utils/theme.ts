import { MD3LightTheme as DefaultTheme } from 'react-native-paper';

export const COLORS = {
  primary: '#1976D2',
  primaryDark: '#0D47A1',
  primaryLight: '#64B5F6',
  secondary: '#FFC107',
  secondaryDark: '#FFA000',
  secondaryLight: '#FFECB3',
  error: '#B00020',
  text: '#212121',
  textLight: '#757575',
  background: '#FFFFFF',
  backgroundLight: '#F5F5F5',
  border: '#E0E0E0',
  success: '#4CAF50',
  warning: '#FF9800',
  info: '#2196F3',
};

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const FONT_SIZES = {
  xs: 12,
  sm: 14,
  md: 16,
  lg: 18,
  xl: 20,
  xxl: 24,
  xxxl: 32,
};

export const BORDER_RADIUS = {
  sm: 4,
  md: 8,
  lg: 16,
  xl: 24,
  round: 999,
};

export const theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: COLORS.primary,
    secondary: COLORS.secondary,
    error: COLORS.error,
    background: COLORS.background,
    surface: COLORS.background,
  },
}; 