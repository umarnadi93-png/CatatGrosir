import { Ionicons } from "@react-native-vector-icons/ionicons";
import { useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import { FlatList, Pressable, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Btn, ConfirmSheet, Empty, Input, Sheet } from "@/src/components/ui";
import { rp, toNum, uid } from "@/src/format";
import { Category, opPerUnit, Product, useStore } from "@/src/store";
import { makeStyles, useTheme } from "@/src/theme";

type OpForm = { id: string; name: string; amount: string };

export default function Admin() {
  const s = useStyles();
  const { colors } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { data, soldCount, updateProduct, deleteProduct, createProduct, findByName, saveCategory, deleteCategory, toast } = useStore();
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<string>("all");
  const [edit, setEdit] = useState<Product | "new" | null>(null);
  const [form, setForm] = useState({ name: "", sell: "", buy: "", qty: "10", catId: "" });
  const [del, setDel] = useState<Product | null>(null);
  const [catEdit, setCatEdit] = useState<{ id: string; name: string; ops: OpForm[]; isNew: boolean } | null>(null);
  const [catDel, setCatDel] = useState<Category | null>(null);

  const catMap = useMemo(() => Object.fromEntries(data.categories.map((c) => [c.id, c])), [data.categories]);
  const selCat = catMap[cat] as Category | undefined;

  const list = useMemo(
    () =>
      data.products
        .filter((p) => p.name.toLowerCase().includes(q.trim().toLowerCase()))
        .filter((p) => (cat === "all" ? true : cat === "none" ? !p.categoryId || !catMap[p.categoryId] : p.categoryId === cat))
        .sort((a, b) => (soldCount[b.id] || 0) - (soldCount[a.id] || 0)),
    [data.products, q, soldCount, cat, catMap],
  );

  const hpp = Math.round(toNum(form.buy) / Math.max(1, toNum(form.qty)));

  const openEdit = (p: Product | "new") => {
    setForm(
      p === "new"
        ? { name: "", sell: "", buy: "", qty: "10", catId: selCat ? selCat.id : "" }
        : {
            name: p.name,
            sell: String(p.sellPrice),
            qty: String(p.buyQty || 1),
            buy: String(p.buyPrice ?? p.costPrice * (p.buyQty || 1)),
            catId: p.categoryId && catMap[p.categoryId] ? p.categoryId : "",
          },
    );
    setEdit(p);
  };

  const save = () => {
    if (!form.name.trim()) return toast("Nama barang wajib diisi", "error");
    if (!toNum(form.sell)) return toast("Harga jual wajib diisi", "error");
    const dup = findByName(form.name);
    if (dup && (edit === "new" || dup.id !== (edit as Product).id)) return toast("Nama barang sudah ada", "error");
    const extra = { categoryId: form.catId || undefined, buyPrice: toNum(form.buy), buyQty: Math.max(1, toNum(form.qty)) };
    if (edit === "new") createProduct(form.name, toNum(form.sell), hpp, extra);
    else if (edit) updateProduct(edit.id, { ...extra, name: form.name.trim(), sellPrice: toNum(form.sell), costPrice: hpp });
    toast("Barang disimpan");
    setEdit(null);
  };

  const openCat = (c?: Category) =>
    setCatEdit(
      c
        ? { id: c.id, name: c.name, isNew: false, ops: c.opCosts.map((o) => ({ id: o.id, name: o.name, amount: String(o.amount) })) }
        : { id: uid(), name: "", isNew: true, ops: [] },
    );

  const saveCat = () => {
    if (!catEdit) return;
    if (!catEdit.name.trim()) return toast("Nama kategori wajib diisi", "error");
    saveCategory({
      id: catEdit.id,
      name: catEdit.name.trim(),
      opCosts: catEdit.ops.filter((o) => o.name.trim() || toNum(o.amount)).map((o) => ({ id: o.id, name: o.name.trim() || "Biaya", amount: toNum(o.amount) })),
    });
    setCat(catEdit.id);
    setCatEdit(null);
    toast("Kategori disimpan");
  };

  const setOp = (id: string, patch: Partial<OpForm>) =>
    catEdit && setCatEdit({ ...catEdit, ops: catEdit.ops.map((o) => (o.id === id ? { ...o, ...patch } : o)) });

  const chips = [{ id: "all", name: "Semua" }, ...data.categories, { id: "none", name: "Tanpa Kategori" }];

  return (
    <View style={s.root}>
      <View style={s.top}>
        <View style={{ flex: 1 }}>
          <Input testID="admin-search-input" placeholder="Cari barang..." value={q} onChangeText={setQ} />
        </View>
        <Btn testID="admin-add-button" title="Barang" icon="add" onPress={() => openEdit("new")} />
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.chipScroll} contentContainerStyle={s.chipRow}>
        {chips.map((c) => (
          <Pressable key={c.id} testID={`admin-cat-chip-${c.id}`} onPress={() => setCat(c.id)} style={[s.chip, cat === c.id && s.chipActive]}>
            <Text style={[s.chipText, cat === c.id && s.chipTextActive]}>{c.name}</Text>
          </Pressable>
        ))}
        <Pressable testID="admin-add-category-button" onPress={() => openCat()} style={[s.chip, s.chipAdd]}>
          <Ionicons name="add" size={16} color={colors.onBrandSecondary} />
          <Text style={[s.chipText, { color: colors.onBrandSecondary }]}>Kategori</Text>
        </Pressable>
      </ScrollView>
      {selCat ? (
        <View style={s.catCard} testID="admin-category-card">
          <View style={{ flex: 1 }}>
            <Text style={s.name}>{selCat.name}</Text>
            <Text style={s.muted} numberOfLines={2}>
              Biaya operasional/unit: {selCat.opCosts.length ? selCat.opCosts.map((o) => `${o.name} ${rp(o.amount)}`).join(", ") : "-"}
            </Text>
            <Text style={s.sold}>Total {rp(opPerUnit(selCat))} per barang terjual</Text>
          </View>
          <Pressable testID="admin-category-edit" style={s.icon} onPress={() => openCat(selCat)}>
            <Ionicons name="settings-outline" size={20} color={colors.brandPrimary} />
          </Pressable>
          <Pressable testID="admin-category-delete" style={s.icon} onPress={() => setCatDel(selCat)}>
            <Ionicons name="trash-outline" size={20} color={colors.error} />
          </Pressable>
        </View>
      ) : null}
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
              <Text style={s.muted}>Jual {rp(p.sellPrice)} • HPP {rp(p.costPrice)}</Text>
              <Text style={s.sold}>{soldCount[p.id] || 0} terjual{p.categoryId && catMap[p.categoryId] ? ` • ${catMap[p.categoryId].name}` : ""}</Text>
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
        <Text style={s.label}>Kategori</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} keyboardShouldPersistTaps="handled" contentContainerStyle={{ gap: 8 }}>
          {[{ id: "", name: "Tanpa Kategori" }, ...data.categories].map((c) => (
            <Pressable key={c.id || "none"} testID={`admin-form-cat-${c.id || "none"}`} onPress={() => setForm({ ...form, catId: c.id })} style={[s.chip, form.catId === c.id && s.chipActive]}>
              <Text style={[s.chipText, form.catId === c.id && s.chipTextActive]}>{c.name}</Text>
            </Pressable>
          ))}
        </ScrollView>
        <View style={{ flexDirection: "row", gap: 12 }}>
          <View style={{ flex: 2 }}>
            <Input testID="admin-form-buy" label="Harga Beli (total)" keyboardType="number-pad" placeholder="0" value={form.buy} onChangeText={(v) => setForm({ ...form, buy: v })} />
          </View>
          <View style={{ flex: 1 }}>
            <Input testID="admin-form-qty" label="Qty" keyboardType="number-pad" value={form.qty} onChangeText={(v) => setForm({ ...form, qty: v })} />
          </View>
        </View>
        <View style={s.hppBox}>
          <Text style={s.muted}>HPP per barang (otomatis)</Text>
          <Text style={s.hpp} testID="admin-form-hpp">{rp(hpp)}</Text>
        </View>
        <Input testID="admin-form-sell" label="Harga Jual per barang" keyboardType="number-pad" placeholder="0" value={form.sell} onChangeText={(v) => setForm({ ...form, sell: v })} />
        {toNum(form.sell) ? (
          <Text style={s.sold} testID="admin-form-margin">
            Laba kotor per barang: {rp(toNum(form.sell) - hpp)}
            {catMap[form.catId] ? ` • setelah biaya operasional: ${rp(toNum(form.sell) - hpp - opPerUnit(catMap[form.catId]))}` : ""}
          </Text>
        ) : null}
        <Btn testID="admin-form-save" title="Simpan" icon="save-outline" onPress={save} />
      </Sheet>
      <Sheet visible={!!catEdit} onClose={() => setCatEdit(null)} title={catEdit?.isNew ? "Kategori Baru" : "Atur Kategori"} testID="category-sheet">
        {catEdit ? (
          <>
            <Input testID="category-form-name" label="Nama Kategori" placeholder="mis. Kopi Seduh" value={catEdit.name} onChangeText={(v) => setCatEdit({ ...catEdit, name: v })} />
            <Text style={s.label}>Biaya Operasional / Tambahan (per barang terjual)</Text>
            {catEdit.ops.map((o, k) => (
              <View key={o.id} style={{ flexDirection: "row", gap: 8, alignItems: "center" }}>
                <View style={{ flex: 2 }}>
                  <Input testID={`category-op-name-${k}`} placeholder="mis. Cup" value={o.name} onChangeText={(v) => setOp(o.id, { name: v })} />
                </View>
                <View style={{ flex: 1 }}>
                  <Input testID={`category-op-amount-${k}`} placeholder="Rp" keyboardType="number-pad" value={o.amount} onChangeText={(v) => setOp(o.id, { amount: v })} />
                </View>
                <Pressable testID={`category-op-delete-${k}`} style={s.icon} onPress={() => setCatEdit({ ...catEdit, ops: catEdit.ops.filter((x) => x.id !== o.id) })}>
                  <Ionicons name="close-circle" size={22} color={colors.error} />
                </Pressable>
              </View>
            ))}
            <Btn testID="category-op-add" title="Tambah Biaya" icon="add" variant="secondary" onPress={() => setCatEdit({ ...catEdit, ops: [...catEdit.ops, { id: uid(), name: "", amount: "" }] })} />
            <Text style={s.sold}>Total biaya: {rp(catEdit.ops.reduce((a, o) => a + toNum(o.amount), 0))} per barang</Text>
            <Btn testID="category-form-save" title="Simpan Kategori" icon="save-outline" onPress={saveCat} />
          </>
        ) : null}
      </Sheet>
      <ConfirmSheet
        visible={!!catDel}
        title="Hapus kategori?"
        message={`Kategori "${catDel?.name}" dihapus. Barangnya pindah ke Tanpa Kategori.`}
        onCancel={() => setCatDel(null)}
        onConfirm={() => {
          if (catDel) deleteCategory(catDel.id);
          setCatDel(null);
          setCat("all");
          toast("Kategori dihapus");
        }}
      />
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
  top: { flexDirection: "row", gap: 8, padding: 16, paddingBottom: 0, alignItems: "center" },
  chipScroll: { flexGrow: 0, height: 56 },
  chipRow: { gap: 8, paddingHorizontal: 16, alignItems: "center" },
  chip: { flexShrink: 0, height: 36, paddingHorizontal: 14, borderRadius: 18, borderWidth: 1, borderColor: c.border, backgroundColor: c.surface, flexDirection: "row", alignItems: "center", gap: 4 },
  chipActive: { backgroundColor: c.brandPrimary, borderColor: c.brandPrimary },
  chipAdd: { backgroundColor: c.brandSecondary, borderColor: c.brandSecondary },
  chipText: { fontSize: 13, fontWeight: "700", color: c.onSurfaceSecondary },
  chipTextActive: { color: c.onBrandPrimary },
  catCard: { flexDirection: "row", alignItems: "center", marginHorizontal: 16, marginBottom: 12, padding: 14, borderRadius: 16, backgroundColor: c.brandTertiary, borderWidth: 1, borderColor: c.brandSecondary },
  label: { fontSize: 13, fontWeight: "600", color: c.onSurfaceSecondary },
  hppBox: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", backgroundColor: c.brandTertiary, padding: 12, borderRadius: 12 },
  hpp: { fontSize: 18, fontWeight: "900", color: c.brandPrimary },
  card: { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: c.surface, borderRadius: 16, padding: 14, borderWidth: 1, borderColor: c.border },
  name: { fontSize: 16, fontWeight: "800", color: c.onSurface },
  muted: { fontSize: 13, color: c.muted },
  sold: { fontSize: 12, fontWeight: "700", color: c.brandPrimary, marginTop: 2 },
  icon: { width: 44, height: 44, alignItems: "center", justifyContent: "center" },
}));
