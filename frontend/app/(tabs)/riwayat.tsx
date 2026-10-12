import { Ionicons } from "@react-native-vector-icons/ionicons";
import React, { useMemo, useState } from "react";
import { FlatList, Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ConfirmSheet, Empty, StatusBadge } from "@/src/components/ui";
import { dayjs, fmtTime, rp } from "@/src/format";
import { usesNativeTabs } from "@/src/navigation";
import { remainingOf, useStore } from "@/src/store";
import { makeStyles, useTheme } from "@/src/theme";

export default function Riwayat() {
  const s = useStyles();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const bottomChrome = usesNativeTabs ? insets.bottom : 0;
  const { data, deleteTransaction, toast } = useStore();
  const [open, setOpen] = useState<string | null>(null);
  const [del, setDel] = useState<string | null>(null);

  const list = useMemo(() => data.transactions.filter((t) => dayjs(t.createdAt).isSame(dayjs(), "day")), [data.transactions]);
  const omzet = list.reduce((a, t) => a + t.total, 0);

  return (
    <View style={s.root}>
      <View style={[s.header, { paddingTop: insets.top + 12 }]}>
        <Text style={s.title}>Riwayat Hari Ini</Text>
        <Text style={s.sub} testID="riwayat-summary">{list.length} transaksi • {rp(omzet)}</Text>
      </View>
      <FlatList
        data={list}
        keyExtractor={(t) => t.id}
        contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: bottomChrome + 24 }}
        ListEmptyComponent={<Empty icon="time-outline" text="Belum ada transaksi hari ini" />}
        renderItem={({ item: t, index }) => (
          <Pressable testID={`riwayat-item-${index}`} style={s.card} onPress={() => setOpen(open === t.id ? null : t.id)}>
            <View style={s.row}>
              <View style={s.timeBox}>
                <Ionicons name="time-outline" size={14} color={colors.onBrandSecondary} />
                <Text style={s.time}>{fmtTime(t.createdAt)}</Text>
              </View>
              <StatusBadge status={t.status} />
              <Text style={s.total}>{rp(t.total)}</Text>
            </View>
            <Text style={s.items} numberOfLines={open === t.id ? undefined : 1}>
              {t.items.map((i) => `${i.name} x${i.qty}`).join(", ")}
            </Text>
            {t.customer ? <Text style={s.muted}>Pelanggan: {t.customer}</Text> : null}
            {open === t.id ? (
              <View style={s.detail}>
                {t.items.map((i) => (
                  <View key={i.productId} style={s.row}>
                    <Text style={[s.muted, { flex: 1 }]}>{i.name} ({i.qty} x {rp(i.price)})</Text>
                    <Text style={s.bold}>{rp(i.qty * i.price)}</Text>
                  </View>
                ))}
                <View style={s.row}><Text style={[s.muted, { flex: 1 }]}>Laba</Text><Text style={s.bold}>{rp(t.profit)}</Text></View>
                {t.cash ? <View style={s.row}><Text style={[s.muted, { flex: 1 }]}>Uang / Kembalian</Text><Text style={s.bold}>{rp(t.cash)} / {rp(t.change)}</Text></View> : null}
                {remainingOf(t) > 0 ? <View style={s.row}><Text style={[s.muted, { flex: 1 }]}>Sisa Piutang</Text><Text style={[s.bold, { color: colors.error }]}>{rp(remainingOf(t))}</Text></View> : null}
                <Pressable testID={`riwayat-delete-${index}`} onPress={() => setDel(t.id)} style={s.delBtn}>
                  <Ionicons name="trash-outline" size={16} color={colors.error} />
                  <Text style={{ color: colors.error, fontWeight: "700" }}>Hapus transaksi</Text>
                </Pressable>
              </View>
            ) : null}
          </Pressable>
        )}
      />
      <ConfirmSheet
        visible={!!del}
        title="Hapus transaksi?"
        message="Transaksi akan dihapus dari riwayat, rekap, dan piutang."
        onCancel={() => setDel(null)}
        onConfirm={() => {
          if (del) deleteTransaction(del);
          setDel(null);
          toast("Transaksi dihapus");
        }}
      />
    </View>
  );
}

const useStyles = makeStyles((c) => ({
  root: { flex: 1, backgroundColor: c.surfaceSecondary },
  header: { backgroundColor: c.surface, paddingHorizontal: 16, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: c.border },
  title: { fontSize: 22, fontWeight: "900", color: c.onSurface },
  sub: { fontSize: 13, color: c.muted, marginTop: 2 },
  card: { backgroundColor: c.surface, borderRadius: 16, padding: 14, gap: 6, borderWidth: 1, borderColor: c.border },
  row: { flexDirection: "row", alignItems: "center", gap: 8 },
  timeBox: { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: c.brandSecondary, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  time: { fontWeight: "800", color: c.onBrandSecondary, fontSize: 13 },
  total: { marginLeft: "auto", fontSize: 16, fontWeight: "900", color: c.onSurface },
  items: { fontSize: 14, color: c.onSurfaceSecondary },
  muted: { fontSize: 13, color: c.muted },
  bold: { fontWeight: "800", color: c.onSurface, fontSize: 13 },
  detail: { gap: 6, marginTop: 6, paddingTop: 8, borderTopWidth: 1, borderTopColor: c.divider },
  delBtn: { flexDirection: "row", gap: 6, alignItems: "center", alignSelf: "flex-start", paddingVertical: 10 },
}));
