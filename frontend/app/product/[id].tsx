import { useLocalSearchParams } from "expo-router";
import React, { useMemo } from "react";
import { FlatList, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Empty, Stat, StatusBadge } from "@/src/components/ui";
import { fmtDate, rp } from "@/src/format";
import { useStore } from "@/src/store";
import { makeStyles } from "@/src/theme";

export default function ProductDetail() {
  const s = useStyles();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data } = useStore();
  const product = data.products.find((p) => p.id === id);

  const st = useMemo(() => {
    const rows = data.transactions
      .map((t) => ({ t, item: t.items.find((i) => i.productId === id) }))
      .filter((r) => r.item) as { t: (typeof data.transactions)[number]; item: (typeof data.transactions)[number]["items"][number] }[];
    return {
      rows,
      qty: rows.reduce((a, r) => a + r.item.qty, 0),
      omzet: rows.reduce((a, r) => a + r.item.qty * r.item.price, 0),
      laba: rows.reduce((a, r) => a + r.item.qty * (r.item.price - r.item.cost), 0),
    };
  }, [data, id]);

  return (
    <View style={s.root}>
      <FlatList
        data={st.rows}
        keyExtractor={(r) => r.t.id}
        contentContainerStyle={{ padding: 16, gap: 10, paddingBottom: insets.bottom + 24 }}
        ListHeaderComponent={
          <View style={{ gap: 10, marginBottom: 6 }}>
            <Text style={s.title} testID="product-detail-name">{product?.name ?? "Barang dihapus"}</Text>
            {product ? <Text style={s.muted}>Harga jual {rp(product.sellPrice)} • Modal {rp(product.costPrice)}</Text> : null}
            <View style={{ flexDirection: "row", gap: 8 }}>
              <Stat icon="cube-outline" label="Terjual" value={String(st.qty)} testID="product-detail-qty" />
              <Stat icon="cash-outline" label="Omzet" value={rp(st.omzet)} testID="product-detail-omzet" />
              <Stat icon="trending-up" label="Laba" value={rp(st.laba)} testID="product-detail-laba" highlight />
            </View>
            <Text style={s.section}>Riwayat Transaksi Terakhir</Text>
          </View>
        }
        ListEmptyComponent={<Empty icon="receipt-outline" text="Belum ada transaksi untuk barang ini" />}
        renderItem={({ item: r, index }) => (
          <View style={s.card} testID={`product-history-${index}`}>
            <View style={{ flex: 1, gap: 4 }}>
              <Text style={s.bold}>{fmtDate(r.t.createdAt)}</Text>
              <Text style={s.muted}>{r.item.qty} x {rp(r.item.price)}{r.t.customer ? ` • ${r.t.customer}` : ""}</Text>
              <StatusBadge status={r.t.status} />
            </View>
            <Text style={s.bold}>{rp(r.item.qty * r.item.price)}</Text>
          </View>
        )}
      />
    </View>
  );
}

const useStyles = makeStyles((c) => ({
  root: { flex: 1, backgroundColor: c.surfaceSecondary },
  title: { fontSize: 22, fontWeight: "900", color: c.onSurface },
  muted: { fontSize: 13, color: c.muted },
  section: { fontSize: 16, fontWeight: "800", color: c.onSurface, marginTop: 6 },
  card: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: c.surface, borderRadius: 16, padding: 14, borderWidth: 1, borderColor: c.border },
  bold: { fontWeight: "800", color: c.onSurface },
}));
