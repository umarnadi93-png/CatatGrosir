import { Ionicons } from "@react-native-vector-icons/ionicons";
import { useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import { FlatList, Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Btn, ConfirmSheet, Empty, Input, Sheet } from "@/src/components/ui";
import { rp, toNum } from "@/src/format";
import { Product, useStore } from "@/src/store";
import { makeStyles, useTheme } from "@/src/theme";

export default function Admin() {
  const s = useStyles();
  const { colors } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { data, soldCount, updateProduct, deleteProduct, createProduct, findByName, toast } = useStore();
  const [q, setQ] = useState("");
  const [edit, setEdit] = useState<Product | "new" | null>(null);
  const [form, setForm] = useState({ name: "", sell: "", cost: "" });
  const [del, setDel] = useState<Product | null>(null);

  const list = useMemo(
    () =>
      data.products
        .filter((p) => p.name.toLowerCase().includes(q.trim().toLowerCase()))
        .sort((a, b) => (soldCount[b.id] || 0) - (soldCount[a.id] || 0)),
    [data.products, q, soldCount],
  );

  const openEdit = (p: Product | "new") => {
    setForm(p === "new" ? { name: "", sell: "", cost: "" } : { name: p.name, sell: String(p.sellPrice), cost: String(p.costPrice) });
    setEdit(p);
  };

  const save = () => {
    if (!form.name.trim()) return toast("Nama barang wajib diisi", "error");
    const dup = findByName(form.name);
    if (dup && (edit === "new" || dup.id !== (edit as Product).id)) return toast("Nama barang sudah ada", "error");
    if (edit === "new") createProduct(form.name, toNum(form.sell), toNum(form.cost));
    else if (edit) updateProduct(edit.id, { name: form.name.trim(), sellPrice: toNum(form.sell), costPrice: toNum(form.cost) });
    toast("Barang disimpan");
    setEdit(null);
  };

  return (
    <View style={s.root}>
      <View style={s.top}>
        <View style={{ flex: 1 }}>
          <Input testID="admin-search-input" placeholder="Cari barang..." value={q} onChangeText={setQ} />
        </View>
        <Btn testID="admin-add-button" title="Baru" icon="add" onPress={() => openEdit("new")} />
      </View>
      <FlatList
        data={list}
        keyExtractor={(p) => p.id}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ padding: 16, paddingTop: 0, gap: 10, paddingBottom: insets.bottom + 24 }}
        ListEmptyComponent={<Empty icon="cube-outline" text="Belum ada barang. Barang otomatis terdaftar saat diinput di Kasir." />}
        renderItem={({ item: p, index }) => (
          <Pressable testID={`admin-item-${index}`} style={s.card} onPress={() => router.push(`/product/${p.id}`)}>
            <View style={{ flex: 1 }}>
              <Text style={s.name} numberOfLines={1}>{p.name}</Text>
              <Text style={s.muted}>Jual {rp(p.sellPrice)} • Modal {rp(p.costPrice)}</Text>
              <Text style={s.sold}>{soldCount[p.id] || 0} terjual</Text>
            </View>
            <Pressable testID={`admin-edit-${index}`} style={s.icon} onPress={() => openEdit(p)}>
              <Ionicons name="create-outline" size={20} color={colors.brandPrimary} />
            </Pressable>
            <Pressable testID={`admin-delete-${index}`} style={s.icon} onPress={() => setDel(p)}>
              <Ionicons name="trash-outline" size={20} color={colors.error} />
            </Pressable>
          </Pressable>
        )}
      />
      <Sheet visible={!!edit} onClose={() => setEdit(null)} title={edit === "new" ? "Tambah Barang" : "Edit Barang"} testID="admin-edit-sheet">
        <Input testID="admin-form-name" label="Nama Barang" value={form.name} onChangeText={(v) => setForm({ ...form, name: v })} />
        <View style={{ flexDirection: "row", gap: 12 }}>
          <View style={{ flex: 1 }}>
            <Input testID="admin-form-sell" label="Harga Jual" keyboardType="number-pad" value={form.sell} onChangeText={(v) => setForm({ ...form, sell: v })} />
          </View>
          <View style={{ flex: 1 }}>
            <Input testID="admin-form-cost" label="Harga Modal" keyboardType="number-pad" value={form.cost} onChangeText={(v) => setForm({ ...form, cost: v })} />
          </View>
        </View>
        <Btn testID="admin-form-save" title="Simpan" icon="save-outline" onPress={save} />
      </Sheet>
      <ConfirmSheet
        visible={!!del}
        title="Hapus barang?"
        message={`"${del?.name}" akan dihapus dari daftar. Riwayat transaksi tetap tersimpan.`}
        onCancel={() => setDel(null)}
        onConfirm={() => {
          if (del) deleteProduct(del.id);
          setDel(null);
          toast("Barang dihapus");
        }}
      />
    </View>
  );
}

const useStyles = makeStyles((c) => ({
  root: { flex: 1, backgroundColor: c.surfaceSecondary },
  top: { flexDirection: "row", gap: 8, padding: 16, alignItems: "center" },
  card: { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: c.surface, borderRadius: 16, padding: 14, borderWidth: 1, borderColor: c.border },
  name: { fontSize: 16, fontWeight: "800", color: c.onSurface },
  muted: { fontSize: 13, color: c.muted },
  sold: { fontSize: 12, fontWeight: "700", color: c.brandPrimary, marginTop: 2 },
  icon: { width: 44, height: 44, alignItems: "center", justifyContent: "center" },
}));
