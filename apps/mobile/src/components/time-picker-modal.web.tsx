import { useEffect, useMemo, useState } from "react";
import { StyleSheet, TextInput, View } from "react-native";
import { useColors } from "@/contexts/theme-context";
import { borderRadius, fontSize, spacing } from "@/theme";
import AppModal from "./app-modal";
import Button from "./button";

interface Props {
  visible: boolean;
  value: string; // "HH:MM"
  onClose: () => void;
  onSelect: (time: string) => void;
}

export default function TimePickerModal({
  visible,
  value,
  onClose,
  onSelect,
}: Props) {
  const colors = useColors();
  const [time, setTime] = useState(value);
  const styles = useMemo(() => makeStyles(colors), [colors]);

  useEffect(() => {
    if (visible) setTime(value);
  }, [visible, value]);

  if (!visible) return null;

  return (
    <AppModal visible={visible} onClose={onClose}>
      <View style={styles.toolbar}>
        <Button title="Cancel" variant="text-secondary" onPress={onClose} />
        <Button
          title="Done"
          variant="text"
          onPress={() => {
            onSelect(time);
            onClose();
          }}
        />
      </View>
      <View style={styles.inputWrap}>
        <TextInput
          value={time}
          onChangeText={setTime}
          style={[
            styles.input,
            { color: colors.text, borderColor: colors.border },
          ]}
          placeholder="HH:MM"
          placeholderTextColor={colors.textSecondary}
          maxLength={5}
        />
      </View>
    </AppModal>
  );
}

const makeStyles = (_colors: ReturnType<typeof useColors>) =>
  StyleSheet.create({
    toolbar: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingHorizontal: spacing.xs,
    },
    inputWrap: {
      padding: spacing.md,
      alignItems: "center",
    },
    input: {
      borderWidth: 1,
      borderRadius: borderRadius.md,
      padding: spacing.md,
      fontSize: fontSize.lg,
      textAlign: "center",
      width: 150,
    },
  });
