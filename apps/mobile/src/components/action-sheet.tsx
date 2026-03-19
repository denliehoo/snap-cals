import { Ionicons } from "@expo/vector-icons";
import { useEffect, useRef } from "react";
import {
  Animated,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
} from "react-native";
import { useColors } from "@/contexts/theme-context";
import { borderRadius, fontSize, fontWeight, spacing } from "@/theme";

export interface ActionSheetOption {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
}

interface Props {
  visible: boolean;
  onClose: () => void;
  options: ActionSheetOption[];
}

export default function ActionSheet({ visible, onClose, options }: Props) {
  const colors = useColors();
  const slide = useRef(new Animated.Value(300)).current;

  useEffect(() => {
    Animated.spring(slide, {
      toValue: visible ? 0 : 300,
      useNativeDriver: true,
    }).start();
  }, [visible]);

  return (
    <Modal visible={visible} transparent animationType="fade">
      <TouchableOpacity
        style={styles.overlay}
        activeOpacity={1}
        onPress={onClose}
      >
        <Animated.View
          style={[
            styles.sheet,
            {
              backgroundColor: colors.surface,
              transform: [{ translateY: slide }],
            },
          ]}
          onStartShouldSetResponder={() => true}
        >
          {options.map((opt) => (
            <TouchableOpacity
              key={opt.label}
              style={styles.option}
              onPress={() => {
                onClose();
                opt.onPress();
              }}
              activeOpacity={0.7}
            >
              <Ionicons
                name={opt.icon}
                size={22}
                color={colors.primary}
                style={styles.icon}
              />
              <Text style={[styles.label, { color: colors.text }]}>
                {opt.label}
              </Text>
            </TouchableOpacity>
          ))}
        </Animated.View>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "flex-end",
  },
  sheet: {
    borderTopLeftRadius: borderRadius.lg,
    borderTopRightRadius: borderRadius.lg,
    paddingVertical: spacing.md,
    paddingBottom: spacing.xl,
  },
  option: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  icon: { marginRight: spacing.md },
  label: { fontSize: fontSize.md, fontWeight: fontWeight.medium },
});
