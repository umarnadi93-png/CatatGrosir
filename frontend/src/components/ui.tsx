import { Ionicons } from "@react-native-vector-icons/ionicons";
import React from "react";
import { Modal, Pressable, ScrollView, StyleProp, Text, TextInput, TextInputProps, View, ViewStyle } from "react-native";
import { KeyboardAvoidingView } from "react-native-keyboard-controller";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { PayStatus, useStore } from "@/src/store";
import { makeStyles, useTheme } from "@/src/theme";

type BtnProps = {
  title: string;
  onPress: () => void;
  variant?: "primary" | "secondary" | "danger" | "ghost";
  icon?: React.ComponentProps<typeof Ionicons>["name"];
  disabled?: boolean;
  testID?: string;
  style?: StyleProp<ViewStyle>;
};

export function Btn({ title, onPress, variant = "primary", icon, disabled, testID, style }: BtnProps) {
  const s = useStyles();
  const { colors } = useTheme();
  const bg = { primary: colors.brandPrimary, secondary: colors.brandSecondary, danger: colors.error, ghost: colors.surfaceTertiary }[variant];
  const fg = { primary: colors.onBrandPrimary, secondary: colors.onBrandSecondary, danger: colors.onError, ghost: colors.onSurfaceTertiary }[variant];
  return (
    <Pressable
      testID={testID}
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [s.btn, { backgroundColor: bg, opacity: disabled ? 0.45 : pressed ? 0.8 : 1, transform: [{ scale: pressed ? 0.98 : 1 }] }, style]}
    >
      {icon ? <Ionicons name={icon} size={18} color={fg} /> : null}
      <Text style={[s.btnText, { color: fg }]}>{title}</Text>
    </Pressable>
  );
}

export function Input(props: TextInputProps & { label?: string }) {
  const s = useStyles();
  const { colors } = useTheme();
  return (
    <View style={{ gap: 6 }}>
      {props.label ? <Text style={s.label}>{props.label}</Text> : null}
      <TextInput placeholderTextColor={colors.muted} {...props} style={[s.input, props.style]} />
    </View>
  );
}

export function Stat({ label, value, testID, icon, highlight }: { label: string; value: string; testID?: string; icon: React.ComponentProps<typeof Ionicons>["name"]; highlight?: boolean }) {
  const s = useStyles();
  const { colors } = useTheme();
  return (
    <View style={[s.stat, highlight && { backgroundColor: colors.brandPrimary }]}>
      <Ionicons name={icon} size={18} color={highlight ? colors.onBrandPrimary : colors.brandPrimary} />
      <Text style={[s.statLabel, highlight && { color: colors.onBrandPrimary }]}>{label}</Text>
      <Text testID={testID} numberOfLines={1} adjustsFontSizeToFit style={[s.statValue, highlight && { color: colors.onBrandPrimary }]}>
        {value}
      </Text>
    </View>
  );
}

export const STATUS_LABEL: Record<PayStatus, string> = { lunas: "Lunas", cicil: "Cicil Bayar", belum: "Belum Bayar" };

export function StatusBadge({ status }: { status: PayStatus }) {
  const s = useStyles();
  const { colors } = useTheme();
  const bg = { lunas: colors.brandSecondary, cicil: colors.warning, belum: colors.error }[status];
  const fg = { lunas: colors.onBrandSecondary, cicil: colors.onWarning, belum: colors.onError }[status];
  return (
    <View style={[s.badge, { backgroundColor: bg }]}>
      <Text style={[s.badgeText, { color: fg }]}>{STATUS_LABEL[status]}</Text>
    </View>
  );
}

export function Sheet({ visible, onClose, title, children, testID }: { visible: boolean; onClose: () => void; title: string; children: React.ReactNode; testID?: string }) {
  const s = useStyles();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose} statusBarTranslucent>
      <KeyboardAvoidingView behavior="padding" style={{ flex: 1 }}>
        <Pressable style={s.backdrop} onPress={onClose} />
        <View testID={testID} style={[s.sheet, { paddingBottom: insets.bottom + 16, maxHeight: "90%" }]}>
          <View style={s.sheetHeader}>
            <Text style={s.sheetTitle}>{title}</Text>
            <Pressable testID={`${testID}-close`} onPress={onClose} hitSlop={12} style={s.iconBtn}>
              <Ionicons name="close" size={22} color={colors.onSurface} />
            </Pressable>
          </View>
          <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ gap: 12 }} showsVerticalScrollIndicator={false}>
            {children}
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

export function ConfirmSheet({ visible, title, message, onConfirm, onCancel, confirmText = "Hapus" }: { visible: boolean; title: string; message: string; onConfirm: () => void; onCancel: () => void; confirmText?: string }) {
  const s = useStyles();
  return (
    <Sheet visible={visible} onClose={onCancel} title={title} testID="confirm-sheet">
      <Text style={s.msg}>{message}</Text>
      <View style={{ flexDirection: "row", gap: 12, marginTop: 16 }}>
        <Btn title="Batal" variant="ghost" onPress={onCancel} style={{ flex: 1 }} testID="confirm-cancel-button" />
        <Btn title={confirmText} variant="danger" onPress={onConfirm} style={{ flex: 1 }} testID="confirm-ok-button" />
      </View>
    </Sheet>
  );
}

export function ToastHost() {
  const { toastMsg } = useStore();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const s = useStyles();
  if (!toastMsg) return null;
  return (
    <View style={[s.toast, { pointerEvents: "none", top: insets.top + 8, backgroundColor: toastMsg.tone === "error" ? colors.error : colors.surfaceInverse }]}>
      <Text testID="toast-message" style={{ color: colors.onSurfaceInverse, fontWeight: "600" }}>{toastMsg.msg}</Text>
    </View>
  );
}

export function Empty({ icon, text }: { icon: React.ComponentProps<typeof Ionicons>["name"]; text: string }) {
  const { colors } = useTheme();
  const s = useStyles();
  return (
    <View style={s.empty}>
      <Ionicons name={icon} size={40} color={colors.muted} />
      <Text style={s.emptyText}>{text}</Text>
    </View>
  );
}

const useStyles = makeStyles((c) => ({
  btn: { minHeight: 48, borderRadius: 12, paddingHorizontal: 16, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 },
  btnText: { fontSize: 15, fontWeight: "700" },
  label: { fontSize: 13, fontWeight: "600", color: c.onSurfaceSecondary },
  input: { minHeight: 48, borderRadius: 12, borderWidth: 1, borderColor: c.border, backgroundColor: c.surface, paddingHorizontal: 14, fontSize: 16, color: c.onSurface },
  stat: { flex: 1, backgroundColor: c.surface, borderRadius: 16, padding: 12, gap: 4, borderWidth: 1, borderColor: c.border },
  statLabel: { fontSize: 12, color: c.muted, fontWeight: "600" },
  statValue: { fontSize: 16, fontWeight: "800", color: c.onSurface },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999, alignSelf: "flex-start" },
  badgeText: { fontSize: 11, fontWeight: "700" },
  backdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.4)" },
  sheet: { backgroundColor: c.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, gap: 12 },
  sheetHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  sheetTitle: { fontSize: 18, fontWeight: "800", color: c.onSurface },
  iconBtn: { width: 44, height: 44, alignItems: "center", justifyContent: "center" },
  msg: { fontSize: 15, color: c.onSurfaceSecondary },
  toast: { position: "absolute", left: 16, right: 16, padding: 14, borderRadius: 12, alignItems: "center" },
  empty: { alignItems: "center", padding: 32, gap: 8 },
  emptyText: { color: c.muted, fontSize: 14, textAlign: "center" },
}));
