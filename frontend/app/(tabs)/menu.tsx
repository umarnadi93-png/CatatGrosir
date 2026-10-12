import { Ionicons } from "@react-native-vector-icons/ionicons";
import { Href, useRouter } from "expo-router";
import React from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { usesNativeTabs } from "@/src/navigation";
import { useStore } from "@/src/store";
import { makeStyles, useTheme } from "@/src/theme";

const ITEMS: { href: Href; title: string; desc: string; icon: React.ComponentProps<typeof Ionicons>["name"]; id: string }[] = [
  { href: "/rekap", title: "Rekap", desc: "Omzet, laba & barang terlaris", icon: "bar-chart", id: "menu-rekap" },
  { href: "/admin", title: "Admin Barang", desc: "Kelola daftar & harga barang", icon: "cube", id: "menu-admin" },
  { href: "/backup", title: "Backup Data", desc: "Ekspor / impor file JSON", icon: "cloud-download", id: "menu-backup" },
];

export default function Menu() {
  const s = useStyles();
  const { colors } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const bottomChrome = usesNativeTabs ? insets.bottom : 0;
  const { data } = useStore();
  return (
    <View style={s.root}>
      <View style={[s.header, { paddingTop: insets.top + 12 }]}>
        <Text style={s.title}>Menu</Text>
        <Text style={s.sub}>{data.products.length} barang • {data.transactions.length} transaksi tersimpan</Text>
      </View>
      <ScrollView contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: bottomChrome + 24 }}>
        {ITEMS.map((it) => (
          <Pressable key={it.id} testID={it.id} onPress={() => router.push(it.href)} style={({ pressed }) => [s.card, pressed && { opacity: 0.8 }]}>
            <View style={s.icon}><Ionicons name={it.icon} size={24} color={colors.onBrandSecondary} /></View>
            <View style={{ flex: 1 }}>
              <Text style={s.cardTitle}>{it.title}</Text>
              <Text style={s.sub}>{it.desc}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.muted} />
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

const useStyles = makeStyles((c) => ({
  root: { flex: 1, backgroundColor: c.surfaceSecondary },
  header: { backgroundColor: c.surface, paddingHorizontal: 16, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: c.border },
  title: { fontSize: 22, fontWeight: "900", color: c.onSurface },
  sub: { fontSize: 13, color: c.muted, marginTop: 2 },
  card: { flexDirection: "row", alignItems: "center", gap: 14, backgroundColor: c.surface, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: c.border },
  icon: { width: 48, height: 48, borderRadius: 14, backgroundColor: c.brandSecondary, alignItems: "center", justifyContent: "center" },
  cardTitle: { fontSize: 16, fontWeight: "800", color: c.onSurface },
}));
