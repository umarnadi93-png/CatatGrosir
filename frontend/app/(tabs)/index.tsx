import { Ionicons } from "@react-native-vector-icons/ionicons";
import React, { useMemo, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Btn, Input, Sheet, Stat, STATUS_LABEL } from "@/src/components/ui";
import { dayjs, rp, toNum } from "@/src/format";
import { usesNativeTabs } from "@/src/navigation";
import { PayStatus, TxItem, useStore } from "@/src/store";
import { makeStyles, useTheme } from "@/src/theme";

export default function Kasir() {
  const s = useStyles();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const bottomChrome = usesNativeTabs ? insets.bottom : 0;
  const { data, soldCount, findByName, createProduct, addTransaction, toast } = useStore();

  const [name, setName] = useState("");
  const [qty, setQty] = useState("1");
  const [sell, setSell] = useState("");
  const [cost, setCost] = useState("");
  const [cart, setCart] = useState<TxItem[]>([]);
  const [status, setStatus] = useState<PayStatus>("lunas");
  const [customer, setCustomer] = useState("");
  const [payOpen, setPayOpen] = useState(false);
  const [cash, setCash] = useState("");
  const [result, setResult] = useState<{ change: number; remaining: number; status: PayStatus } | null>(null);

  const today = useMemo(() => {
    const t = data.transactions.filter((x) => dayjs(x.createdAt).isSame(dayjs(), "day"));
    return { count: t.length, omzet: t.reduce((a, x) => a + x.total, 0), laba: t.reduce((a, x) => a + x.profit, 0) };
  }, [data.transactions]);

  const existing = name.trim() ? findByName(name) : undefined;
  const suggestions = useMemo(() => {
    const q = name.trim().toLowerCase();
    if (!q) return [];
    return data.products
      .filter((p) => p.name.toLowerCase().includes(q) && p.name.toLowerCase() !== q)
      .sort((a, b) => (soldCount[b.id] || 0) - (soldCount[a.id] || 0))
      .slice(0, 10);
  }, [name, data.products, soldCount]);

  const total = cart.reduce((a, i) => a + i.qty * i.price, 0);
  const profit = cart.reduce((a, i) => a + i.qty * (i.price - i.cost), 0);

  const addToCart = () => {
    const q = Math.max(1, toNum(qty));
    if (!name.trim()) return toast("Isi nama barang dulu", "error");
    let p = existing;
    if (!p) {
      const sp = toNum(sell);
      if (!sp) return toast("Isi harga jual barang baru", "error");
      p = createProduct(name, sp, toNum(cost));
    }
    const prod = p;
    setCart((c) => {
      const idx = c.findIndex((i) => i.productId === prod.id);
      if (idx >= 0) return c.map((i, k) => (k === idx ? { ...i, qty: i.qty + q } : i));
      return [{ productId: prod.id, name: prod.name, qty: q, price: prod.sellPrice, cost: prod.costPrice }, ...c];
    });
    setName("");
    setQty("1");
    setSell("");
    setCost("");
  };

  const openPay = () => {
    if (!cart.length) return toast("Daftar belanja masih kosong", "error");
    if (status !== "lunas" && !customer.trim()) return toast("Nama pelanggan wajib untuk cicil / belum bayar", "error");
    setCash(status === "belum" ? "" : "");
    setResult(null);
    setPayOpen(true);
  };

  const cashNum = toNum(cash);
  const saveTx = () => {
    let paid = 0;
    if (status === "lunas") {
      if (cashNum < total) return toast("Uang konsumen kurang dari total", "error");
      paid = total;
    } else if (status === "cicil") {
      if (cashNum <= 0) return toast("Isi nominal cicilan pertama", "error");
      paid = Math.min(cashNum, total);
    }
    const st: PayStatus = status !== "lunas" && paid >= total ? "lunas" : status;
    const change = Math.max(0, cashNum - total);
    addTransaction({
      items: cart,
      total,
      profit,
      status: st,
      customer: customer.trim(),
      payments: paid > 0 ? [{ amount: paid, date: new Date().toISOString() }] : [],
      cash: cashNum,
      change,
    });
    setResult({ change, remaining: total - paid, status: st });
    setCart([]);
    setStatus("lunas");
    setCustomer("");
  };

  const closePay = () => {
    setPayOpen(false);
    setResult(null);
    setCash("");
  };

  return (
    <View style={s.root}>
      <View style={[s.header, { paddingTop: insets.top + 12 }]}>
        <Text style={s.brand}>CatatGrosir</Text>
        <Text style={s.date}>{dayjs().format("dddd, DD MMMM YYYY")}</Text>
      </View>
      <KeyboardAwareScrollView bottomOffset={24} keyboardShouldPersistTaps="handled" contentContainerStyle={[s.content, { paddingBottom: bottomChrome + 24 }]}>
        <View style={s.stats}>
          <Stat icon="receipt-outline" label="Transaksi" value={String(today.count)} testID="dashboard-total-transaksi" />
          <Stat icon="cash-outline" label="Omzet" value={rp(today.omzet)} testID="dashboard-total-omzet" />
          <Stat icon="trending-up" label="Laba" value={rp(today.laba)} testID="dashboard-total-laba" highlight />
        </View>
        <Text style={s.hint}>Ringkasan hari ini</Text>

        <View style={s.card}>
          <Text style={s.sectionTitle}>Daftar Belanja ({cart.length})</Text>
          {cart.length === 0 ? <Text style={s.muted}>Belum ada barang. Ketik nama barang di bawah.</Text> : null}
          {cart.map((i, idx) => (
            <View key={i.productId} style={s.cartRow} testID={`cart-item-${idx}`}>
              <View style={{ flex: 1 }}>
                <Text style={s.itemName} numberOfLines={1}>{i.name}</Text>
                <Text style={s.muted}>{i.qty} x {rp(i.price)} = <Text style={s.bold}>{rp(i.qty * i.price)}</Text></Text>
              </View>
              <Pressable testID={`cart-item-plus-${idx}`} style={s.plusBtn} onPress={() => setCart((c) => c.map((x) => (x.productId === i.productId ? { ...x, qty: x.qty + 1 } : x)))}>
                <Text style={s.plusText}>+1</Text>
              </Pressable>
              <Pressable testID={`cart-item-delete-${idx}`} style={s.delBtn} onPress={() => setCart((c) => c.filter((x) => x.productId !== i.productId))}>
                <Ionicons name="trash-outline" size={20} color={colors.error} />
              </Pressable>
            </View>
          ))}
        </View>

        <View style={s.card}>
          {suggestions.length > 0 ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} keyboardShouldPersistTaps="handled" contentContainerStyle={s.sugRow}>
              {suggestions.map((p, k) => (
                <Pressable key={p.id} testID={`suggestion-${k}`} style={s.sug} onPress={() => setName(p.name)}>
                  <Text style={s.sugName} numberOfLines={1}>{p.name}</Text>
                  <Text style={s.sugPrice}>{rp(p.sellPrice)}</Text>
                </Pressable>
              ))}
            </ScrollView>
          ) : null}
          <Input testID="input-nama-barang" label="Nama Barang" placeholder="Ketik nama barang..." value={name} onChangeText={setName} returnKeyType="done" onSubmitEditing={addToCart} />
          {existing ? (
            <Text style={s.found} testID="existing-product-info">Harga: {rp(existing.sellPrice)} • Modal: {rp(existing.costPrice)}</Text>
          ) : name.trim() ? (
            <View style={{ flexDirection: "row", gap: 12 }}>
              <View style={{ flex: 1 }}>
                <Input testID="input-harga-jual" label="Harga Jual (baru)" keyboardType="number-pad" value={sell} onChangeText={setSell} placeholder="0" />
              </View>
              <View style={{ flex: 1 }}>
                <Input testID="input-harga-modal" label="Harga Modal" keyboardType="number-pad" value={cost} onChangeText={setCost} placeholder="0" />
              </View>
            </View>
          ) : null}
          <Text style={s.label}>Qty Pembelian</Text>
          <View style={s.qtyRow}>
            <Pressable testID="qty-minus-button" style={s.qtyBtn} onPress={() => setQty(String(Math.max(1, toNum(qty) - 1)))}>
              <Ionicons name="remove" size={20} color={colors.onBrandSecondary} />
            </Pressable>
            <Input testID="input-qty" keyboardType="number-pad" value={qty} onChangeText={setQty} style={s.qtyInput} />
            <Pressable testID="qty-plus-button" style={[s.qtyBtn, { backgroundColor: colors.brandPrimary }]} onPress={() => setQty(String(toNum(qty) + 1))}>
              <Text style={[s.plusText, { color: colors.onBrandPrimary }]}>+1</Text>
            </Pressable>
            <Btn testID="add-to-cart-button" title="Tambah" icon="add" onPress={addToCart} style={{ flex: 1 }} />
          </View>
        </View>

        <View style={s.card}>
          <Text style={s.sectionTitle}>Status Bayar</Text>
          <View style={s.statusRow}>
            {(["lunas", "cicil", "belum"] as PayStatus[]).map((k) => (
              <Pressable key={k} testID={`status-${k}`} onPress={() => setStatus(k)} style={[s.chip, status === k && s.chipActive]}>
                <Text style={[s.chipText, status === k && s.chipTextActive]}>{STATUS_LABEL[k]}</Text>
              </Pressable>
            ))}
          </View>
          {status !== "lunas" ? (
            <Input testID="input-nama-pelanggan" label="Nama Pelanggan (wajib)" placeholder="Nama pelanggan" value={customer} onChangeText={setCustomer} />
          ) : null}
        </View>

        <View style={s.totalBar}>
          <View>
            <Text style={s.totalLabel}>Total</Text>
            <Text style={s.totalValue} testID="cart-total">{rp(total)}</Text>
          </View>
          <Btn testID="save-transaction-button" title="Simpan Transaksi" icon="checkmark-circle" onPress={openPay} style={{ flex: 1, marginLeft: 16 }} />
        </View>
      </KeyboardAwareScrollView>

      <Sheet visible={payOpen} onClose={closePay} title={result ? "Transaksi Tersimpan" : "Pembayaran"} testID="pay-sheet">
        {result ? (
          <View style={{ gap: 12 }}>
            <View style={s.changeBox}>
              <Ionicons name="checkmark-circle" size={40} color={colors.brandPrimary} />
              <Text style={s.muted}>{result.status === "lunas" ? "Kembalian" : "Sisa Piutang"}</Text>
              <Text style={s.changeValue} testID="change-amount">{rp(result.status === "lunas" ? result.change : result.remaining)}</Text>
              {result.status !== "lunas" && result.change > 0 ? <Text style={s.muted}>Kembalian: {rp(result.change)}</Text> : null}
            </View>
            <Btn testID="pay-done-button" title="Selesai" onPress={closePay} />
          </View>
        ) : (
          <View style={{ gap: 12 }}>
            <View style={s.payRow}><Text style={s.muted}>Total Belanja</Text><Text style={s.bold} testID="pay-total">{rp(total)}</Text></View>
            <View style={s.payRow}><Text style={s.muted}>Status</Text><Text style={s.bold}>{STATUS_LABEL[status]}</Text></View>
            {status !== "belum" ? (
              <>
                <Input testID="input-uang-konsumen" autoFocus label={status === "lunas" ? "Uang Konsumen" : "Bayar Sekarang (cicilan)"} keyboardType="number-pad" placeholder="0" value={cash ? Number(toNum(cash)).toLocaleString("id-ID") : ""} onChangeText={setCash} />
                {status === "lunas" ? (
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} keyboardShouldPersistTaps="handled" contentContainerStyle={{ gap: 8 }}>
                    {[total, 10000, 20000, 50000, 100000].filter((v, i, a) => v > 0 && a.indexOf(v) === i).map((v, k) => (
                      <Pressable key={v} testID={`quick-cash-${k}`} style={s.quick} onPress={() => setCash(String(v))}>
                        <Text style={s.quickText}>{k === 0 ? "Uang Pas" : rp(v)}</Text>
                      </Pressable>
                    ))}
                  </ScrollView>
                ) : null}
                <View style={s.payRow}>
                  <Text style={s.muted}>{status === "lunas" ? "Kembalian" : "Sisa Piutang"}</Text>
                  <Text style={[s.bold, { color: colors.brandPrimary, fontSize: 18 }]} testID="pay-preview">
                    {status === "lunas" ? rp(Math.max(0, cashNum - total)) : rp(Math.max(0, total - cashNum))}
                  </Text>
                </View>
              </>
            ) : (
              <Text style={s.muted}>Seluruh total akan dicatat sebagai piutang atas nama {customer}.</Text>
            )}
            <Btn testID="confirm-payment-button" title="Simpan" icon="save-outline" onPress={saveTx} />
          </View>
        )}
      </Sheet>
    </View>
  );
}

const useStyles = makeStyles((c) => ({
  root: { flex: 1, backgroundColor: c.surfaceSecondary },
  header: { backgroundColor: c.brandPrimary, paddingHorizontal: 16, paddingBottom: 16 },
  brand: { fontSize: 24, fontWeight: "900", color: c.onBrandPrimary },
  date: { fontSize: 13, color: c.onBrandPrimary, opacity: 0.85, marginTop: 2 },
  content: { padding: 16, gap: 12 },
  stats: { flexDirection: "row", gap: 8 },
  hint: { fontSize: 12, color: c.muted, marginTop: -4 },
  card: { backgroundColor: c.surface, borderRadius: 16, padding: 16, gap: 12, borderWidth: 1, borderColor: c.border },
  sectionTitle: { fontSize: 15, fontWeight: "800", color: c.onSurface },
  muted: { fontSize: 13, color: c.muted },
  bold: { fontWeight: "800", color: c.onSurface },
  label: { fontSize: 13, fontWeight: "600", color: c.onSurfaceSecondary },
  cartRow: { flexDirection: "row", alignItems: "center", gap: 8, paddingVertical: 6, borderTopWidth: 1, borderTopColor: c.divider },
  itemName: { fontSize: 15, fontWeight: "700", color: c.onSurface },
  plusBtn: { minWidth: 48, height: 40, borderRadius: 10, backgroundColor: c.brandSecondary, alignItems: "center", justifyContent: "center" },
  plusText: { fontWeight: "800", color: c.onBrandSecondary, fontSize: 15 },
  delBtn: { width: 44, height: 40, alignItems: "center", justifyContent: "center" },
  sugRow: { gap: 8 },
  sug: { flexShrink: 0, backgroundColor: c.brandTertiary, borderWidth: 1, borderColor: c.brandSecondary, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 8, maxWidth: 180 },
  sugName: { fontWeight: "700", color: c.onBrandTertiary, fontSize: 14 },
  sugPrice: { fontSize: 12, color: c.muted },
  found: { fontSize: 13, color: c.brandPrimary, fontWeight: "600" },
  qtyRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  qtyBtn: { width: 48, height: 48, borderRadius: 12, backgroundColor: c.brandSecondary, alignItems: "center", justifyContent: "center" },
  qtyInput: { width: 64, textAlign: "center" },
  statusRow: { flexDirection: "row", gap: 8 },
  chip: { flex: 1, height: 40, borderRadius: 10, borderWidth: 1, borderColor: c.border, alignItems: "center", justifyContent: "center", backgroundColor: c.surface },
  chipActive: { backgroundColor: c.brandPrimary, borderColor: c.brandPrimary },
  chipText: { fontSize: 13, fontWeight: "700", color: c.onSurfaceSecondary },
  chipTextActive: { color: c.onBrandPrimary },
  totalBar: { flexDirection: "row", alignItems: "center", backgroundColor: c.surface, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: c.border },
  totalLabel: { fontSize: 12, color: c.muted },
  totalValue: { fontSize: 20, fontWeight: "900", color: c.onSurface },
  payRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  quick: { flexShrink: 0, height: 36, paddingHorizontal: 12, borderRadius: 10, backgroundColor: c.brandSecondary, justifyContent: "center" },
  quickText: { fontWeight: "700", color: c.onBrandSecondary, fontSize: 13 },
  changeBox: { alignItems: "center", gap: 4, paddingVertical: 12 },
  changeValue: { fontSize: 32, fontWeight: "900", color: c.brandPrimary },
}));
