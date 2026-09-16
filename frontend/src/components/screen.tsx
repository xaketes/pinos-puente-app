import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import type { ReactNode } from "react";

import { useTheme } from "@/src/theme";
import { usesNativeTabs } from "@/src/navigation";

export function Screen({ children, scroll = true, testID }: { children: ReactNode; scroll?: boolean; testID?: string }) {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const contentStyle = { paddingTop: insets.top + 18, paddingBottom: usesNativeTabs ? insets.bottom + 20 : 20 };
  if (!scroll) return <View testID={testID} style={[styles.root, { backgroundColor: colors.surface }, contentStyle]}>{children}</View>;
  return <ScrollView testID={testID} style={[styles.root, { backgroundColor: colors.surface }]} contentContainerStyle={contentStyle} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">{children}</ScrollView>;
}

export function Header({ kicker, title, subtitle, icon }: { kicker: string; title: string; subtitle: string; icon: keyof typeof MaterialCommunityIcons.glyphMap }) {
  const { colors } = useTheme();
  return <View style={styles.header}>
    <View style={[styles.headerIcon, { backgroundColor: colors.brandTertiary }]}><MaterialCommunityIcons name={icon} size={24} color={colors.brandPrimary} /></View>
    <View style={styles.headerCopy}><Text style={[styles.kicker, { color: colors.brandPrimary }]}>{kicker}</Text><Text style={[styles.title, { color: colors.onSurface }]}>{title}</Text><Text style={[styles.subtitle, { color: colors.muted }]}>{subtitle}</Text></View>
  </View>;
}

export function SectionTitle({ title, action }: { title: string; action?: string }) {
  const { colors } = useTheme();
  return <View style={styles.sectionTitle}><Text style={[styles.sectionText, { color: colors.onSurface }]}>{title}</Text>{action ? <Text style={[styles.sectionAction, { color: colors.muted }]}>{action}</Text> : null}</View>;
}

export function EmptyState({ icon, title, message }: { icon: keyof typeof MaterialCommunityIcons.glyphMap; title: string; message: string }) {
  const { colors } = useTheme();
  return <View style={[styles.empty, { backgroundColor: colors.surfaceSecondary, borderColor: colors.border }]}><MaterialCommunityIcons name={icon} size={34} color={colors.brandPrimary} /><Text style={[styles.emptyTitle, { color: colors.onSurface }]}>{title}</Text><Text style={[styles.emptyMessage, { color: colors.muted }]}>{message}</Text></View>;
}

export function PrimaryButton({ label, onPress, disabled = false, icon }: { label: string; onPress: () => void; disabled?: boolean; icon?: keyof typeof MaterialCommunityIcons.glyphMap }) {
  const { colors } = useTheme();
  return <Pressable accessibilityRole="button" disabled={disabled} onPress={onPress} style={({ pressed }) => [styles.primaryButton, { backgroundColor: disabled ? colors.surfaceTertiary : colors.brandPrimary }, pressed && !disabled && styles.pressed]}>{icon ? <MaterialCommunityIcons name={icon} size={19} color={disabled ? colors.muted : colors.onBrandPrimary} /> : null}<Text style={[styles.primaryText, { color: disabled ? colors.muted : colors.onBrandPrimary }]}>{label}</Text></Pressable>;
}

export const sharedStyles = StyleSheet.create({
  card: { borderRadius: 16, borderWidth: 1, padding: 16, marginBottom: 14 },
  fieldLabel: { fontSize: 12, fontWeight: "800", letterSpacing: 0.8, textTransform: "uppercase", marginBottom: 7 },
  input: { borderRadius: 10, borderWidth: 1, paddingHorizontal: 13, height: 48, fontSize: 15 },
});

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { flexDirection: "row", gap: 13, alignItems: "flex-start", marginBottom: 26, paddingHorizontal: 18 },
  headerIcon: { width: 48, height: 48, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  headerCopy: { flex: 1 },
  kicker: { fontSize: 11, fontWeight: "900", letterSpacing: 1.5, marginBottom: 3 },
  title: { fontSize: 30, fontWeight: "900", letterSpacing: -0.5 },
  subtitle: { fontSize: 14, lineHeight: 20, marginTop: 4 },
  sectionTitle: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 18, marginBottom: 10, marginTop: 10 },
  sectionText: { fontSize: 18, fontWeight: "800" },
  sectionAction: { fontSize: 12, fontWeight: "700" },
  empty: { marginHorizontal: 18, padding: 28, minHeight: 190, borderRadius: 16, borderWidth: 1, alignItems: "center", justifyContent: "center", gap: 8 },
  emptyTitle: { fontSize: 18, fontWeight: "800", textAlign: "center", marginTop: 3 },
  emptyMessage: { fontSize: 14, lineHeight: 20, textAlign: "center", maxWidth: 300 },
  primaryButton: { minHeight: 52, borderRadius: 13, paddingHorizontal: 18, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 },
  primaryText: { fontSize: 15, fontWeight: "900" },
  pressed: { opacity: 0.78, transform: [{ scale: 0.98 }] },
});