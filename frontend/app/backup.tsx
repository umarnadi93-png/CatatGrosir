import { Ionicons } from "@react-native-vector-icons/ionicons";
import * as DocumentPicker from "expo-document-picker";
import { File, Paths } from "expo-file-system";
import * as Sharing from "expo-sharing";
import React, { useState } from "react";
import { Platform, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Btn, ConfirmSheet } from "@/src/components/ui";
import { dayjs } from "@/src/format";
import { AppData, useStore } from "@/src/store";
import { makeStyles, useTheme } from "@/src/theme";

export default function Backup() {
  const s = useStyles();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { data, replaceAll, toast } = useStore();
  const [pending, setPending] = useState<AppData | null>(null);

  const exportData = async () => {
    const json = JSON.stringify({ app: "CatatGrosir", exportedAt: new Date().toISOString(), ...data }, null, 2);
    const name = `catatgrosir-backup-${dayjs().format("YYYYMMDD-HHmm")}.json`;
    try {
      if (Platform.OS === "web") {
        const blob = new Blob([json], { type: "application/json" });
        const a = (globalThis as any).document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = name;
        a.click();
      } else {
        const file = new File(Paths.cache, name);
        if (file.exists) file.delete();
        file.create();
        file.write(json);
        await Sharing.shareAsync(file.uri, { mimeType: "application/json", dialogTitle: "Simpan backup CatatGrosir" });
      }
      toast("Backup dibuat");
    } catch {
      toast("Gagal membuat backup", "error");
    }
  };

  const importData = async () => {
    try {
      const res = await DocumentPicker.getDocumentAsync({ type: ["application/json", "*/*"], copyToCacheDirectory: true });
      if (res.canceled || !res.assets?.[0]) return;
      const uri = res.assets[0].uri;
      const text = Platform.OS === "web" ? await (await fetch(uri)).text() : await new File(uri).text();
      const d = JSON.parse(text);
      if (!Array.isArray(d.products) || !Array.isArray(d.transactions)) throw new Error("invalid");
      setPending({ products: d.products, transactions: d.transactions });
    } catch {
      toast("File backup tidak valid", "error");
    }
  };

  return (
    <ScrollView style={s.root} contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: insets.bottom + 24 }}>
      <View style={s.card}>
        <Ionicons name="server-outline" size={28} color={colors.brandPrimary} />
        <Text style={s.title}>Data tersimpan di HP</Text>
        <Text style={s.muted} testID="backup-summary">{data.products.length} barang • {data.transactions.length} transaksi</Text>
      </View>
      <View style={s.card}>
        <Text style={s.title}>Ekspor Backup</Text>
        <Text style={s.muted}>Simpan semua data ke file JSON. Kirim ke Google Drive, WhatsApp, atau simpan di memori HP.</Text>
        <Btn testID="backup-export-button" title="Ekspor ke JSON" icon="download-outline" onPress={exportData} />
      </View>
      <View style={s.card}>
        <Text style={s.title}>Pulihkan dari Backup</Text>
        <Text style={s.muted}>Pilih file JSON backup CatatGrosir. Data saat ini akan diganti.</Text>
        <Btn testID="backup-import-button" title="Impor File JSON" icon="push-outline" variant="secondary" onPress={importData} />
      </View>
      <ConfirmSheet
        visible={!!pending}
        title="Ganti data?"
        message={`Data sekarang akan diganti dengan ${pending?.products.length ?? 0} barang dan ${pending?.transactions.length ?? 0} transaksi dari file backup.`}
        confirmText="Pulihkan"
        onCancel={() => setPending(null)}
        onConfirm={() => {
          if (pending) replaceAll(pending);
          setPending(null);
          toast("Data berhasil dipulihkan");
        }}
      />
    </ScrollView>
  );
}

const useStyles = makeStyles((c) => ({
  root: { flex: 1, backgroundColor: c.surfaceSecondary },
  card: { backgroundColor: c.surface, borderRadius: 16, padding: 16, gap: 10, borderWidth: 1, borderColor: c.border },
  title: { fontSize: 16, fontWeight: "800", color: c.onSurface },
  muted: { fontSize: 13, color: c.muted, lineHeight: 19 },
}));
