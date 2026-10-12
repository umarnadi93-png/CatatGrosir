import React, { useMemo, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Empty, Stat } from "@/src/components/ui";
import { dayjs, rp } from "@/src/format";
import { paidOf, remainingOf, useStore } from "@/src/store";
import { makeStyles } from "@/src/theme";

type Period = "hari" | "minggu" | "bulan";
const LABEL: Record<Period, string> = { hari: "Hari Ini", minggu: "7 Hari", bulan: "Bulan Ini" };

export default function Rekap() {
  const s = useStyles();
  const insets = useSafeAreaInsets();
  const { data } = useStore();
  const [p, setP] = useState<Period>("hari");

  const r = useMemo(() => {
    const start = p === "hari" ? dayjs().startOf("day") : p === "minggu" ? dayjs().subtract(6, "day").startOf("day") : dayjs().startOf("month");
    const list = data.transactions.filter((t) => !dayjs(t.createdAt).isBefore(start));
    const top: Record<string, { name: string; qty: number; omzet: number }> = {};
    list.forEach((t) =>
      t.items.forEach((i) => {
        const e = (top[i.productId] ||= { name: i.name, qty: 0, omzet: 0 });
        e.qty += i.qty;
        e.omzet += i.qty * i.price;
      }),
    );
    return {
      count: list.length,
      omzet: list.reduce((a, t) => a + t.total, 0),
      laba: list.reduce((a, t) => a + t.profit, 0),
      masuk: list.reduce((a, t) => a + paidOf(t), 0),
      piutang: list.reduce((a, t) => a + remainingOf(t), 0),
      top: Object.values(top).sort((a, b) => b.qty - a.qty).slice(0, 10),
      range: `${start.format("DD MMM YYYY")} - ${dayjs().format("DD MMM YYYY")}`,
    };
  }, [data.transactions, p]);

  return (
    <View style={s.root}>
      <View style={s.segWrap}>
        {(Object.keys(LABEL) as Period[]).map((k) => (
          <Pressable key={k} testID={`rekap-period-${k}`} onPress={() => setP(k)} style={[s.seg, p === k && s.segActive]}>
            <Text style={[s.segText, p === k && s.segTextActive]}>{LABEL[k]}</Text>
          </Pressable>
        ))}
      </View>
      <ScrollView contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: insets.bottom + 24 }}>
        <Text style={s.muted}>{r.range}</Text>
        <View style={s.row}>
          <Stat icon="receipt-outline" label="Transaksi" value={String(r.count)} testID="rekap-transaksi" />
          <Stat icon="cash-outline" label="Omzet" value={rp(r.omzet)} testID="rekap-omzet" />
        </View>
        <View style={s.row}>
          <Stat icon="trending-up" label="Laba" value={rp(r.laba)} testID="rekap-laba" highlight />
          <Stat icon="wallet-outline" label="Uang Masuk" value={rp(r.masuk)} testID="rekap-masuk" />
        </View>
        <View style={s.row}>
          <Stat icon="alert-circle-outline" label="Piutang dari periode ini" value={rp(r.piutang)} testID="rekap-piutang" />
        </View>
        <View style={s.card}>
          <Text style={s.title}>Barang Terlaris</Text>
          {r.top.length === 0 ? <Empty icon="podium-outline" text="Belum ada penjualan" /> : null}
          {r.top.map((t, i) => (
            <View key={t.name + i} style={s.topRow} testID={`rekap-top-${i}`}>
              <Text style={s.rank}>{i + 1}</Text>
              <Text style={s.name} numberOfLines={1}>{t.name}</Text>
              <View style={{ alignItems: "flex-end" }}>
                <Text style={s.bold}>{t.qty} terjual</Text>
                <Text style={s.muted}>{rp(t.omzet)}</Text>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const useStyles = makeStyles((c) => ({
  root: { flex: 1, backgroundColor: c.surfaceSecondary },
  segWrap: { flexDirection: "row", gap: 8, padding: 16, paddingBottom: 0 },
  seg: { flex: 1, height: 40, borderRadius: 10, borderWidth: 1, borderColor: c.border, backgroundColor: c.surface, alignItems: "center", justifyContent: "center" },
  segActive: { backgroundColor: c.brandPrimary, borderColor: c.brandPrimary },
  segText: { fontWeight: "700", color: c.onSurfaceSecondary },
  segTextActive: { color: c.onBrandPrimary },
  row: { flexDirection: "row", gap: 8 },
  muted: { fontSize: 13, color: c.muted },
  card: { backgroundColor: c.surface, borderRadius: 16, padding: 16, gap: 10, borderWidth: 1, borderColor: c.border },
  title: { fontSize: 16, fontWeight: "800", color: c.onSurface },
  topRow: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 6, borderTopWidth: 1, borderTopColor: c.divider },
  rank: { width: 28, height: 28, borderRadius: 14, backgroundColor: c.brandSecondary, color: c.onBrandSecondary, textAlign: "center", lineHeight: 28, fontWeight: "800" },
  name: { flex: 1, fontSize: 15, fontWeight: "700", color: c.onSurface },
  bold: { fontWeight: "800", color: c.onSurface },
}));
