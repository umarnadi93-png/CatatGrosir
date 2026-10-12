import { Ionicons } from "@react-native-vector-icons/ionicons";
import { Tabs } from "expo-router";
import { NativeTabs } from "expo-router/unstable-native-tabs";
import { Platform } from "react-native";

import { usesNativeTabs } from "@/src/navigation";
import { useTheme } from "@/src/theme";

export default function TabsLayout() {
  const { colors } = useTheme();
  if (usesNativeTabs) {
    return (
      <NativeTabs tintColor={colors.brandPrimary}>
        <NativeTabs.Trigger name="index">
          <NativeTabs.Trigger.Icon sf="cart.fill" />
          <NativeTabs.Trigger.Label>Kasir</NativeTabs.Trigger.Label>
        </NativeTabs.Trigger>
        <NativeTabs.Trigger name="riwayat">
          <NativeTabs.Trigger.Icon sf="clock.fill" />
          <NativeTabs.Trigger.Label>Riwayat</NativeTabs.Trigger.Label>
        </NativeTabs.Trigger>
        <NativeTabs.Trigger name="piutang">
          <NativeTabs.Trigger.Icon sf="creditcard.fill" />
          <NativeTabs.Trigger.Label>Piutang</NativeTabs.Trigger.Label>
        </NativeTabs.Trigger>
        <NativeTabs.Trigger name="menu">
          <NativeTabs.Trigger.Icon sf="square.grid.2x2.fill" />
          <NativeTabs.Trigger.Label>Menu</NativeTabs.Trigger.Label>
        </NativeTabs.Trigger>
      </NativeTabs>
    );
  }
  const icon = (n: React.ComponentProps<typeof Ionicons>["name"]) =>
    function TabIcon({ color }: { color: import("react-native").ColorValue }) {
      return <Ionicons name={n} size={22} color={color as string} />;
    };
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.brandPrimary,
        tabBarInactiveTintColor: colors.muted,
        tabBarStyle: { backgroundColor: colors.surface, borderTopColor: colors.border, ...(Platform.OS === "web" ? { height: 64 } : {}) },
        tabBarItemStyle: { alignSelf: "center" },
        tabBarLabelStyle: { fontWeight: "700", fontSize: 11 },
      }}
    >
      <Tabs.Screen name="index" options={{ title: "Kasir", tabBarIcon: icon("cart"), tabBarButtonTestID: "tab-kasir" }} />
      <Tabs.Screen name="riwayat" options={{ title: "Riwayat", tabBarIcon: icon("time"), tabBarButtonTestID: "tab-riwayat" }} />
      <Tabs.Screen name="piutang" options={{ title: "Piutang", tabBarIcon: icon("wallet"), tabBarButtonTestID: "tab-piutang" }} />
      <Tabs.Screen name="menu" options={{ title: "Menu", tabBarIcon: icon("grid"), tabBarButtonTestID: "tab-menu" }} />
    </Tabs>
  );
}
