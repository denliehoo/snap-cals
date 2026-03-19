import { useEffect, useMemo, useState } from "react";
import { StyleSheet, View } from "react-native";
import { Calendar } from "react-native-calendars";
import { useColors } from "@/contexts/theme-context";
import { spacing } from "@/theme";
import { toLocalDateString } from "@/utils/date";
import AppModal from "./app-modal";
import Button from "./button";

interface DatePickerModalProps {
  visible: boolean;
  value: string;
  onClose: () => void;
  onSelect: (date: string) => void;
}

export default function DatePickerModal({
  visible,
  value,
  onClose,
  onSelect,
}: DatePickerModalProps) {
  const colors = useColors();
  const [pickerDate, setPickerDate] = useState(value);
  const [calendarKey, setCalendarKey] = useState(0);
  const styles = useMemo(() => makeStyles(colors), [colors]);

  useEffect(() => {
    if (visible) setPickerDate(value);
  }, [visible, value]);

  const handleDone = () => {
    onSelect(pickerDate);
    onClose();
  };

  const handleTodayPress = () => {
    const today = toLocalDateString();
    setPickerDate(today);
    setCalendarKey((k) => k + 1);
  };

  return (
    <AppModal visible={visible} onClose={onClose}>
      <View style={styles.toolbar}>
        <View style={styles.toolbarLeft}>
          <Button title="Cancel" variant="text-secondary" onPress={onClose} />
          <Button title="Today" variant="text" onPress={handleTodayPress} />
        </View>
        <Button title="Done" variant="text" onPress={handleDone} />
      </View>
      <Calendar
        key={calendarKey}
        current={pickerDate}
        onDayPress={(day: { dateString: string }) =>
          setPickerDate(day.dateString)
        }
        markedDates={{
          [pickerDate]: { selected: true, selectedColor: colors.primary },
        }}
        theme={{
          backgroundColor: colors.surface,
          calendarBackground: colors.surface,
          dayTextColor: colors.text,
          monthTextColor: colors.text,
          textDisabledColor: colors.textSecondary,
          arrowColor: colors.primary,
          todayTextColor: colors.primary,
          textSectionTitleColor: colors.textSecondary,
          selectedDayBackgroundColor: colors.primary,
          selectedDayTextColor: colors.textOnPrimary,
        }}
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
    toolbarLeft: { flexDirection: "row", alignItems: "center" },
  });
