export const colors = {
  primary: "#2E7D32",
  primaryDark: "#1B5E20",
  primaryLight: "#E8F5E9",
  secondary: "#FF9800",
  background: "#F5F5F5",
  surface: "#FFFFFF",
  textOnPrimary: "#FFFFFF",
  text: "#1C1C1E",
  textSecondary: "#8E8E93",
  border: "#E5E5EA",
  error: "#FF3B30",
  success: "#34C759",
  warning: "#FF9500",
  calorieColor: "#FF6B35",
  proteinColor: "#007AFF",
  carbsColor: "#FF9500",
  fatColor: "#AF52DE",
};

export const darkColors: typeof colors = {
  primary: "#4CAF50",
  primaryDark: "#81C784",
  primaryLight: "#1B3A1D",
  secondary: "#FFB74D",
  background: "#000000",
  surface: "#1C1C1E",
  textOnPrimary: "#FFFFFF",
  text: "#F5F5F5",
  textSecondary: "#8E8E93",
  border: "#38383A",
  error: "#FF453A",
  success: "#30D158",
  warning: "#FFD60A",
  calorieColor: "#FF6B35",
  proteinColor: "#64D2FF",
  carbsColor: "#FFD60A",
  fatColor: "#BF5AF2",
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
};

export const fontSize = {
  xs: 12,
  sm: 14,
  md: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
};

export const borderRadius = {
  sm: 4,
  md: 8,
  lg: 16,
  full: 9999,
};

export const fontWeight = {
  regular: "400" as const,
  medium: "500" as const,
  semibold: "600" as const,
  bold: "700" as const,
};

export const shadow = {
  sm: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 3,
  },
} as const;
