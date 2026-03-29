import DateTimePicker from "@react-native-community/datetimepicker";
import { useEffect, useMemo, useState } from "react";
import { Platform, StyleSheet, View } from "react-native";
import { useColors } from "@/contexts/theme-context";
import { spacing } from "@/theme";
import AppModal from "./app-modal";
import Button from "./button";

interface Props {
  visible: boolean;
  value: string; // "HH:MM"
  onClose: () => void;
  onSelect: (time: string) => void;
}

function toDate(time: string) {
  const [h, m] = time.split(":").map(Number);
  const d = new Date();
  d.setHours(h, m, 0, 0);
  return d;
}

function toTimeString(d: Date) {
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

export default function TimePickerModal({
  visible,
  value,
  onClose,
  onSelect,
}: Props) {
  const colors = useColors();
  const [date, setDate] = useState(() => toDate(value));
  const styles = useMemo(() => makeStyles(colors), [colors]);

  useEffect(() => {
    if (visible) setDate(toDate(value));
  }, [visible, value]);

  if (!visible) return null;

  // Android: native clock dialog, handles its own UI
  if (Platform.OS === "android") {
    return (
      <DateTimePicker
        value={date}
        mode="time"
        display="clock"
        is24Hour={false}
        onChange={(_event, selected) => {
          onClose();
          if (selected) onSelect(toTimeString(selected));
        }}
      />
    );
  }

  // iOS: spinner inside our themed modal
  return (
    <AppModal visible={visible} onClose={onClose}>
      <View style={styles.toolbar}>
        <Button title="Cancel" variant="text-secondary" onPress={onClose} />
        <Button
          title="Done"
          variant="text"
          onPress={() => {
            onSelect(toTimeString(date));
            onClose();
          }}
        />
      </View>
      <DateTimePicker
        value={date}
        mode="time"
        display="spinner"
        is24Hour={false}
        onChange={(_event, selected) => {
          if (selected) setDate(selected);
        }}
        themeVariant={colors.background === "#000000" ? "dark" : "light"}
      />
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
  });
