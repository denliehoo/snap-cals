import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useMemo, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import Button from "@/components/button";
import DatePickerModal from "@/components/date-picker-modal";
import FormField from "@/components/form-field";
import { useSnackbar } from "@/components/snackbar";
import TimePickerModal from "@/components/time-picker-modal";
import { useColors } from "@/contexts/theme-context";
import type { MainStackParamList } from "@/navigation";
import { fontSize, fontWeight, spacing } from "@/theme";
import { parseLocalDate } from "@/utils/date";
import { useWeightLog } from "./use-weight-log";

type Props = NativeStackScreenProps<MainStackParamList, "WeightLog">;

export default function WeightLogScreen({ navigation, route }: Props) {
  const colors = useColors();
  const { show } = useSnackbar();
  const {
    isEdit,
    weightUnit,
    weight,
    setWeight,
    date,
    setDate,
    time,
    setTime,
    note,
    setNote,
    loading,
    error,
    submit,
  } = useWeightLog(route.params?.entry);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const dateLabel = parseLocalDate(date).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });

  const [h, m] = time.split(":");
  const hour = Number.parseInt(h, 10);
  const ampm = hour >= 12 ? "PM" : "AM";
  const hour12 = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
  const timeLabel = `${hour12}:${m} ${ampm}`;

  const handleSave = () => {
    submit(
      () => {
        show(isEdit ? "Weight updated" : "Weight logged");
        navigation.goBack();
      },
      (msg) => show(msg, "error"),
    );
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={styles.title}>{isEdit ? "Edit Weight" : "Log Weight"}</Text>

      <FormField
        label={`Weight (${weightUnit}) *`}
        value={weight}
        onChangeText={setWeight}
        placeholder={weightUnit}
        keyboardType="decimal-pad"
        error={error}
      />

      <FormField
        label="Date *"
        value={dateLabel}
        onChangeText={() => {}}
        onPress={() => setShowDatePicker(true)}
        editable={false}
      />
      <DatePickerModal
        visible={showDatePicker}
        value={date}
        onClose={() => setShowDatePicker(false)}
        onSelect={setDate}
      />

      <FormField
        label="Time *"
        value={timeLabel}
        onChangeText={() => {}}
        onPress={() => setShowTimePicker(true)}
        editable={false}
      />
      <TimePickerModal
        visible={showTimePicker}
        value={time}
        onClose={() => setShowTimePicker(false)}
        onSelect={setTime}
      />

      <FormField
        label="Note"
        value={note}
        onChangeText={setNote}
        placeholder="Optional note"
      />

      <View style={styles.actions}>
        <Button
          title={isEdit ? "Update" : "Save"}
          onPress={handleSave}
          loading={loading}
        />
      </View>
    </ScrollView>
  );
}

const makeStyles = (colors: ReturnType<typeof useColors>) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    content: { padding: spacing.lg, paddingBottom: spacing.xl * 2 },
    title: {
      fontSize: fontSize.xl,
      fontWeight: fontWeight.bold,
      color: colors.text,
      marginBottom: spacing.lg,
    },
    actions: { marginTop: spacing.sm },
  });
