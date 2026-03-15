import React from "react";
import { Modal, TouchableOpacity, View, StyleSheet } from "react-native";
import { spacing } from "../theme";
import { useColors } from "../contexts/theme-context";

interface Props {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

export default function AppModal({ visible, onClose, children }: Props) {
  const colors = useColors();

  return (
    <Modal visible={visible} transparent animationType="fade">
      <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={onClose}>
        <View style={[styles.content, { backgroundColor: colors.surface }]} onStartShouldSetResponder={() => true}>
          {children}
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", alignItems: "center" },
  content: { borderRadius: 16, padding: spacing.sm, width: 340 },
});
