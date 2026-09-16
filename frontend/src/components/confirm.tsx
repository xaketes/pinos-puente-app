import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Modal, Pressable, Text, View } from "react-native";

import { makeStyles, useTheme } from "@/src/theme";

type ConfirmDialogProps = {
  visible: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  icon?: keyof typeof MaterialCommunityIcons.glyphMap;
  onConfirm?: () => void;
  onClose: () => void;
  testID?: string;
};

export function ConfirmDialog({ visible, title, message, confirmLabel = "Aceptar", cancelLabel, destructive = false, icon = "alert-circle-outline", onConfirm, onClose, testID }: ConfirmDialogProps) {
  const { colors } = useTheme();
  const styles = useStyles();
  return <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
    <View style={styles.backdrop}>
      <View testID={testID} style={[styles.card, { backgroundColor: colors.surfaceSecondary, borderColor: colors.border }]}>
        <View style={[styles.iconWrap, { backgroundColor: colors.surfaceTertiary }]}><MaterialCommunityIcons name={icon} size={24} color={destructive ? colors.error : colors.brandPrimary} /></View>
        <Text style={[styles.title, { color: colors.onSurface }]}>{title}</Text>
        <Text style={[styles.message, { color: colors.muted }]}>{message}</Text>
        <View style={styles.actions}>
          {cancelLabel ? <Pressable testID={testID ? `${testID}-cancel` : undefined} accessibilityRole="button" onPress={onClose} style={[styles.button, { backgroundColor: colors.surfaceTertiary }]}><Text style={[styles.cancelText, { color: colors.muted }]}>{cancelLabel}</Text></Pressable> : null}
          <Pressable testID={testID ? `${testID}-confirm` : undefined} accessibilityRole="button" onPress={() => { onConfirm?.(); onClose(); }} style={[styles.button, { backgroundColor: destructive ? colors.error : colors.brandPrimary }]}><Text style={[styles.confirmText, { color: destructive ? colors.onError : colors.onBrandPrimary }]}>{confirmLabel}</Text></Pressable>
        </View>
      </View>
    </View>
  </Modal>;
}

const useStyles = makeStyles(() => ({
  backdrop: { flex: 1, backgroundColor: "rgba(4, 10, 7, 0.72)", alignItems: "center", justifyContent: "center", padding: 28 },
  card: { width: "100%", maxWidth: 340, borderRadius: 18, borderWidth: 1, padding: 20, alignItems: "center" },
  iconWrap: { width: 48, height: 48, borderRadius: 15, alignItems: "center", justifyContent: "center", marginBottom: 13 },
  title: { fontSize: 17, fontWeight: "900", textAlign: "center" },
  message: { fontSize: 13, lineHeight: 19, textAlign: "center", marginTop: 7 },
  actions: { flexDirection: "row", gap: 9, marginTop: 18, alignSelf: "stretch" },
  button: { flex: 1, minHeight: 46, borderRadius: 11, alignItems: "center", justifyContent: "center" },
  cancelText: { fontSize: 13, fontWeight: "800" },
  confirmText: { fontSize: 13, fontWeight: "900" },
}));
