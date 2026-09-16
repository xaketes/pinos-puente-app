import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import { NativeTabs } from "expo-router/unstable-native-tabs";
import { Platform } from "react-native";

import { usesNativeTabs } from "@/src/navigation";
import { useTheme } from "@/src/theme";

export default function TabsLayout() {
  const { colors } = useTheme();
  if (usesNativeTabs) {
    return (
      <NativeTabs>
        <NativeTabs.Trigger name="index"><NativeTabs.Trigger.Icon sf="checkmark.circle.fill" /><NativeTabs.Trigger.Label>Convoca</NativeTabs.Trigger.Label></NativeTabs.Trigger>
        <NativeTabs.Trigger name="match"><NativeTabs.Trigger.Icon sf="sportscourt.fill" /><NativeTabs.Trigger.Label>Partido</NativeTabs.Trigger.Label></NativeTabs.Trigger>
        <NativeTabs.Trigger name="standings"><NativeTabs.Trigger.Icon sf="list.number" /><NativeTabs.Trigger.Label>Tabla</NativeTabs.Trigger.Label></NativeTabs.Trigger>
        <NativeTabs.Trigger name="admin"><NativeTabs.Trigger.Icon sf="person.3.fill" /><NativeTabs.Trigger.Label>Admin</NativeTabs.Trigger.Label></NativeTabs.Trigger>
      </NativeTabs>
    );
  }
  return (
    <Tabs screenOptions={{ headerShown: false, tabBarActiveTintColor: colors.brandPrimary, tabBarInactiveTintColor: colors.muted, tabBarLabelStyle: { fontSize: 11, fontWeight: "700" }, tabBarStyle: { backgroundColor: colors.surfaceSecondary, borderTopColor: colors.border, ...(Platform.OS === "web" ? { height: 64 } : {}) }, tabBarItemStyle: { alignSelf: "center" } }}>
      <Tabs.Screen name="index" options={{ title: "Convoca", tabBarIcon: ({ color, size }) => <MaterialCommunityIcons name="check-circle-outline" color={color} size={size} /> }} />
      <Tabs.Screen name="match" options={{ title: "Partido", tabBarIcon: ({ color, size }) => <MaterialCommunityIcons name="soccer-field" color={color} size={size} /> }} />
      <Tabs.Screen name="standings" options={{ title: "Tabla", tabBarIcon: ({ color, size }) => <MaterialCommunityIcons name="format-list-numbered" color={color} size={size} /> }} />
      <Tabs.Screen name="admin" options={{ title: "Admin", tabBarIcon: ({ color, size }) => <MaterialCommunityIcons name="account-group-outline" color={color} size={size} /> }} />
    </Tabs>
  );
}