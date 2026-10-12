import React, { useMemo, useState } from "react";
import { FlatList, Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Btn, Empty, Input, Sheet, StatusBadge } from "@/src/components/ui";
import { fmtDate, rp, toNum } from "@/src/format";
import { usesNativeTabs } from "@/src/navigation";
import { paidOf, remainingOf, Tx, useStore } from "@/src/store";
import { makeStyles, useTheme } from "@/src/theme";

export default function Piutang() {
  const s = useStyles();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const bottomChrome = usesNativeTabs ? insets.bottom : 0;
  const { data, addPayment, toast } = useStore();
  const [q, setQ] = useState("");
  const [sel, setSel] = useState<Tx | null>(null);
  const [amt, setAmt] = useState("");

  const all = useMemo(() => data.transactions.filter((t) => t.status !== "lunas" && remainingOf(t) > 0), [data.transactions]);
  const list = all.filter((t) => t.customer.toLowerCase().includes(q.trim().toLowerCase()));
  const totalPiutang = all.reduce((a, t) => a + remainingOf(t), 0);

  const pay = (full: boolean) => {
    if (!sel) return;
    const rem = remainingOf(sel);
    const v = full ? rem : Math.min(toNum(amt), rem);
    if (v <= 0) return toast("Isi nominal pembayaran", "error");
    addPayment(sel.id, v);
    toast(v >= rem ? "Piutang lunas" : `Pembayaran ${rp(v)} dicatat`);
    setSel(null);
    setAmt("");
  };

  return (
    <View style={s.root}>
      <View style={[s.header, { paddingTop: insets.top + 12 }]}>
        <Text style={s.title}>Piutang</Text>
        <View style={s.totalBox}>
          <Text style={s.totalLabel}>Total piutang ({all.length} transaksi)</Text>
          <Text style={s.totalValue} testID="piutang-total">{rp(totalPiutang)}</Text>
        </View>
        <Input testID="piutang-search-input" placeholder="Cari nama pelanggan..." value={q} onChangeText={setQ} />
      </View>
      <FlatList
        data={list}
        keyExtractor={(t) => t.id}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: bottomChrome + 24 }}
        ListEmptyComponent={<Empty icon="wallet-outline" text="Tidak ada piutang" />}
        renderItem={({ item: t, index }) => (
          <Pressable testID={`piutang-item-${index}`} style={s.card} onPress={() => setSel(t)}>
            <View style={s.row}>
              <Text style={s.name} numberOfLines={1}>{t.customer || "-"}</Text>
              <StatusBadge status={t.status} />
            </View>
            <Text style={s.muted}>{fmtDate(t.createdAt)} • {t.items.map((i) => `${i.name} x${i.qty}`).join(", ")}</Text>
            <View style={s.row}>
              <Text style={s.muted}>Total {rp(t.total)} • Dibayar {rp(paidOf(t))}</Text>
              <Text style={[s.rem, { color: colors.error }]}>{rp(remainingOf(t))}</Text>
            </View>
          </Pressable>
        )}
      />
      <Sheet visible={!!sel} onClose={() => setSel(null)} title={`Bayar Piutang - ${sel?.customer ?? ""}`} testID="piutang-pay-sheet">
        {sel ? (
          <View style={{ gap: 12 }}>
            <View style={s.row}><Text style={s.muted}>Total</Text><Text style={s.bold}>{rp(sel.total)}</Text></View>
            <View style={s.row}><Text style={s.muted}>Sisa</Text><Text style={[s.bold, { color: colors.error }]} testID="piutang-remaining">{rp(remainingOf(sel))}</Text></View>
            {sel.payments.length ? (
              <View style={s.hist}>
                <Text style={s.bold}>Riwayat pembayaran</Text>
                {sel.payments.map((p, k) => (
                  <View key={k} style={s.row}><Text style={s.muted}>{fmtDate(p.date)}</Text><Text style={s.bold}>{rp(p.amount)}</Text></View>
                ))}
              </View>
            ) : null}
            <Input testID="piutang-amount-input" label="Nominal bayar" keyboardType="number-pad" placeholder="0" value={amt} onChangeText={setAmt} />
            <View style={{ flexDirection: "row", gap: 12 }}>
              <Btn testID="piutang-pay-button" title="Catat Bayar" variant="secondary" onPress={() => pay(false)} style={{ flex: 1 }} />
              <Btn testID="piutang-full-button" title="Lunasi" onPress={() => pay(true)} style={{ flex: 1 }} />
            </View>
          </View>
        ) : null}
      </Sheet>
    </View>
  );
}

const useStyles = makeStyles((c) => ({
  root: { flex: 1, backgroundColor: c.surfaceSecondary },
  header: { backgroundColor: c.surface, paddingHorizontal: 16, paddingBottom: 12, gap: 10, borderBottomWidth: 1, borderBottomColor: c.border },
  title: { fontSize: 22, fontWeight: "900", color: c.onSurface },
  totalBox: { backgroundColor: c.brandPrimary, borderRadius: 16, padding: 14 },
  totalLabel: { color: c.onBrandPrimary, fontSize: 12, opacity: 0.9 },
  totalValue: { color: c.onBrandPrimary, fontSize: 24, fontWeight: "900" },
  card: { backgroundColor: c.surface, borderRadius: 16, padding: 14, gap: 6, borderWidth: 1, borderColor: c.border },
  row: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 },
  name: { fontSize: 16, fontWeight: "800", color: c.onSurface, flex: 1 },
  muted: { fontSize: 13, color: c.muted, flexShrink: 1 },
  rem: { fontSize: 16, fontWeight: "900" },
  bold: { fontWeight: "800", color: c.onSurface },
  hist: { gap: 6, backgroundColor: c.surfaceSecondary, padding: 12, borderRadius: 12 },
}));
