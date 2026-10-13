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
  const [sel, setSel] = useState<string | null>(null);
  const [amt, setAmt] = useState("");

  const all = useMemo(() => data.transactions.filter((t) => t.status !== "lunas" && remainingOf(t) > 0), [data.transactions]);
  const groups = useMemo(() => {
    const m: Record<string, { key: string; name: string; txs: Tx[]; remaining: number; total: number }> = {};
    all.forEach((t) => {
      const key = (t.customer || "-").trim().toLowerCase();
      const g = (m[key] ||= { key, name: t.customer || "-", txs: [], remaining: 0, total: 0 });
      g.txs.push(t);
      g.remaining += remainingOf(t);
      g.total += t.total;
    });
    Object.values(m).forEach((g) => g.txs.sort((a, b) => a.createdAt.localeCompare(b.createdAt)));
    return Object.values(m).sort((a, b) => b.remaining - a.remaining);
  }, [all]);
  const list = groups.filter((g) => g.key.includes(q.trim().toLowerCase()));
  const totalPiutang = all.reduce((a, t) => a + remainingOf(t), 0);
  const group = groups.find((g) => g.key === sel);

  const pay = (full: boolean) => {
    if (!group) return;
    let v = full ? group.remaining : Math.min(toNum(amt), group.remaining);
    if (v <= 0) return toast("Isi nominal pembayaran", "error");
    const paidTotal = v;
    for (const t of group.txs) {
      if (v <= 0) break;
      const part = Math.min(v, remainingOf(t));
      addPayment(t.id, part);
      v -= part;
    }
    toast(paidTotal >= group.remaining ? `Piutang ${group.name} lunas` : `Pembayaran ${rp(paidTotal)} dicatat`);
    if (paidTotal >= group.remaining) setSel(null);
    setAmt("");
  };

  return (
    <View style={s.root}>
      <View style={[s.header, { paddingTop: insets.top + 12 }]}>
        <Text style={s.title}>Piutang</Text>
        <View style={s.totalBox}>
          <Text style={s.totalLabel}>Total piutang ({groups.length} pelanggan • {all.length} transaksi)</Text>
          <Text style={s.totalValue} testID="piutang-total">{rp(totalPiutang)}</Text>
        </View>
        <Input testID="piutang-search-input" placeholder="Cari nama pelanggan..." value={q} onChangeText={setQ} />
      </View>
      <FlatList
        data={list}
        keyExtractor={(g) => g.key}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: bottomChrome + 24 }}
        ListEmptyComponent={<Empty icon="wallet-outline" text="Tidak ada piutang" />}
        renderItem={({ item: g, index }) => (
          <Pressable testID={`piutang-item-${index}`} style={s.card} onPress={() => setSel(g.key)}>
            <View style={s.row}>
              <View style={s.avatar}><Text style={s.avatarText}>{g.name.charAt(0).toUpperCase()}</Text></View>
              <View style={{ flex: 1 }}>
                <Text style={s.name} numberOfLines={1}>{g.name}</Text>
                <Text style={s.muted}>{g.txs.length} transaksi • sejak {fmtDate(g.txs[0].createdAt)}</Text>
              </View>
            </View>
            <View style={s.row}>
              <Text style={s.muted}>Total belanja {rp(g.total)}</Text>
              <Text style={[s.rem, { color: colors.error }]} testID={`piutang-customer-total-${index}`}>{rp(g.remaining)}</Text>
            </View>
          </Pressable>
        )}
      />
      <Sheet visible={!!group} onClose={() => setSel(null)} title={`Piutang - ${group?.name ?? ""}`} testID="piutang-pay-sheet">
        {group ? (
          <View style={{ gap: 12 }}>
            <View style={s.row}><Text style={s.muted}>Total sisa utang</Text><Text style={[s.bold, { color: colors.error, fontSize: 18 }]} testID="piutang-remaining">{rp(group.remaining)}</Text></View>
            {group.txs.map((t, k) => (
              <View key={t.id} style={s.hist} testID={`piutang-tx-${k}`}>
                <View style={s.row}><Text style={s.bold}>{fmtDate(t.createdAt)}</Text><StatusBadge status={t.status} /></View>
                <Text style={s.muted}>{t.items.map((i) => `${i.name} x${i.qty}`).join(", ")}</Text>
                <View style={s.row}><Text style={s.muted}>Total {rp(t.total)} • Dibayar {rp(paidOf(t))}</Text><Text style={[s.bold, { color: colors.error }]}>{rp(remainingOf(t))}</Text></View>
                {t.payments.map((p, j) => (
                  <Text key={j} style={s.muted}>• {fmtDate(p.date)}: {rp(p.amount)}</Text>
                ))}
              </View>
            ))}
            <Input testID="piutang-amount-input" label="Nominal bayar (dibayar dari utang terlama)" keyboardType="number-pad" placeholder="0" value={amt} onChangeText={setAmt} />
            <View style={{ flexDirection: "row", gap: 12 }}>
              <Btn testID="piutang-pay-button" title="Catat Bayar" variant="secondary" onPress={() => pay(false)} style={{ flex: 1 }} />
              <Btn testID="piutang-full-button" title="Lunasi Semua" onPress={() => pay(true)} style={{ flex: 1 }} />
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
  avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: c.brandSecondary, alignItems: "center", justifyContent: "center" },
  avatarText: { fontSize: 18, fontWeight: "900", color: c.onBrandSecondary },
}));
