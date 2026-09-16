import { useMemo } from "react";
import { Appearance, StyleSheet, useColorScheme } from "react-native";

export type ColorScheme = "light" | "dark";

const dark = {
  surface: "#121614",
  onSurface: "#F4F7F5",
  surfaceSecondary: "#1A221E",
  onSurfaceSecondary: "#E0E8E3",
  surfaceTertiary: "#243029",
  onSurfaceTertiary: "#A3B8AD",
  surfaceInverse: "#F4F7F5",
  onSurfaceInverse: "#121614",
  muted: "#8FA396",
  brand: "#10B981",
  onBrand: "#091C14",
  brandPrimary: "#10B981",
  onBrandPrimary: "#091C14",
  brandSecondary: "#F59E0B",
  onBrandSecondary: "#1A1508",
  brandTertiary: "#1A3326",
  onBrandTertiary: "#34D399",
  success: "#10B981",
  onSuccess: "#091C14",
  warning: "#F59E0B",
  onWarning: "#1A1508",
  error: "#EF4444",
  onError: "#FFF5F5",
  info: "#3B82F6",
  onInfo: "#EFF6FF",
  border: "#23332A",
  borderStrong: "#10B981",
  divider: "#1E2B23",
};

export type ThemeColors = typeof dark;
export const defaultScheme = "dark" satisfies ColorScheme;
export const themes: { light: ThemeColors; dark?: ThemeColors } = { light: dark, dark };

export function setColorScheme(scheme: ColorScheme | null) {
  Appearance.setColorScheme?.(scheme ?? "unspecified");
}

setColorScheme(null);

export function useTheme(): { scheme: ColorScheme; colors: ThemeColors } {
  const system = useColorScheme();
  const scheme: ColorScheme = system === "light" ? "light" : "dark";
  return { scheme, colors: themes[scheme] ?? themes.dark ?? themes.light };
}

export function makeStyles<T extends StyleSheet.NamedStyles<T> | StyleSheet.NamedStyles<any>>(
  factory: (colors: ThemeColors) => T & StyleSheet.NamedStyles<any>,
): () => T {
  return function useStyles(): T {
    const { colors } = useTheme();
    return useMemo(() => StyleSheet.create(factory(colors)), [colors]);
  };
}